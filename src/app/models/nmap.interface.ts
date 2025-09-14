import { NmapScanResult, NmapPort } from '../core/services/nmap.service';

export interface ProcessedPortInfo {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
  product?: string;
  protocol: string;
}

export interface ProcessedNmapResult {
  overallScore: number;
  openPorts: ProcessedPortInfo[];
  serverConfig: Array<{
    component: string;
    status: 'ok' | 'warning' | 'critical';
    details: string;
  }>;
  firewall: {
    status: 'enabled' | 'disabled' | 'partial';
    type: string;
    message: string;
  };
  scanInfo: {
    target: string;
    scanTime: string;
    totalPorts: number;
    openPortsCount: number;
    filteredPortsCount: number;
    closedPortsCount: number;
  };
}

/**
 * Classe utilitaire pour traiter les résultats nmap
 */
export class NmapResultProcessor {
  
  /**
   * Convertit les résultats nmap bruts en format utilisable par l'interface
   */
  static processNmapResult(nmapResult: NmapScanResult): ProcessedNmapResult {
    const ports = nmapResult.host.ports.port;
    const processedPorts = this.processPorts(ports);
    
    const openPortsCount = processedPorts.filter(p => p.status === 'open').length;
    const filteredPortsCount = processedPorts.filter(p => p.status === 'filtered').length;
    const closedPortsCount = processedPorts.filter(p => p.status === 'closed').length;
    
    const overallScore = this.calculateSecurityScore(processedPorts);
    
    return {
      overallScore,
      openPorts: processedPorts,
      serverConfig: this.generateServerConfig(processedPorts),
      firewall: this.analyzeFirewall(processedPorts),
      scanInfo: {
        target: nmapResult.host.address['@addr'],
        scanTime: new Date(parseInt(nmapResult.host['@starttime']) * 1000).toLocaleString(),
        totalPorts: ports.length,
        openPortsCount,
        filteredPortsCount,
        closedPortsCount
      }
    };
  }

  /**
   * Traite la liste des ports nmap
   */
  private static processPorts(ports: NmapPort[]): ProcessedPortInfo[] {
    return ports.map(port => ({
      port: parseInt(port['@portid']),
      service: this.getServiceName(port),
      status: this.mapPortStatus(port.state['@state']),
      product: port.service['@product'],
      protocol: port['@protocol']
    }));
  }

  /**
   * Mappe le statut du port nmap vers notre format
   */
  private static mapPortStatus(nmapStatus: string): 'open' | 'closed' | 'filtered' {
    switch (nmapStatus.toLowerCase()) {
      case 'open':
        return 'open';
      case 'closed':
        return 'closed';
      case 'filtered':
        return 'filtered';
      default:
        return 'filtered';
    }
  }

  /**
   * Obtient le nom du service de manière plus lisible
   */
  private static getServiceName(port: NmapPort): string {
    const serviceName = port.service['@name'];
    const product = port.service['@product'];
    
    // Mapping des services communs
    const serviceMap: { [key: string]: string } = {
      'http': 'HTTP',
      'https': 'HTTPS',
      'ssl/http': 'SSL/HTTP',
      'ssh': 'SSH',
      'mysql': 'MySQL',
      'ftp': 'FTP',
      'smtp': 'SMTP',
      'pop3': 'POP3',
      'imap': 'IMAP',
      'telnet': 'Telnet',
      'rdp': 'RDP',
      'vnc': 'VNC',
      'http-alt': 'HTTP-Alt',
      'unknown': 'Inconnu'
    };
    
    // Si le service est connu, utiliser le mapping
    if (serviceName && serviceName !== 'unknown') {
      return serviceMap[serviceName.toLowerCase()] || serviceName.toUpperCase();
    }
    
    // Si le service est inconnu mais qu'on a un produit, l'utiliser
    if (serviceName === 'unknown' && product) {
      return product;
    }
    
    // Si le service est inconnu, essayer de deviner par le port
    const portNumber = parseInt(port['@portid']);
    const portServiceMap: { [key: number]: string } = {
      22: 'SSH',
      80: 'HTTP',
      443: 'HTTPS',
      21: 'FTP',
      23: 'Telnet',
      25: 'SMTP',
      53: 'DNS',
      110: 'POP3',
      143: 'IMAP',
      993: 'IMAPS',
      995: 'POP3S',
      3306: 'MySQL',
      5432: 'PostgreSQL',
      1433: 'MSSQL',
      27017: 'MongoDB',
      8080: 'HTTP-Alt',
      8443: 'HTTPS-Alt',
      3389: 'RDP',
      5900: 'VNC'
    };
    
    return portServiceMap[portNumber] || `Port ${port['@portid']}`;
  }

  /**
   * Calcule un score de sécurité basé sur les ports ouverts
   */
  private static calculateSecurityScore(ports: ProcessedPortInfo[]): number {
    const openPorts = ports.filter(p => p.status === 'open');
    const filteredPorts = ports.filter(p => p.status === 'filtered');
    
    let score = 100;
    
    // Pénalité pour les ports ouverts
    openPorts.forEach(port => {
      switch (port.port) {
        case 80:
        case 443:
          score -= 5; // HTTP/HTTPS sont normaux
          break;
        case 22:
          score -= 10; // SSH ouvert peut être un risque
          break;
        case 21:
        case 23:
          score -= 20; // FTP/Telnet sont des risques
          break;
        case 3306:
        case 5432:
        case 1433:
          score -= 25; // Bases de données ouvertes
          break;
        default:
          score -= 15; // Autres ports ouverts
      }
    });
    
    // Bonus pour les ports filtrés (pare-feu actif)
    const filteredRatio = filteredPorts.length / ports.length;
    if (filteredRatio > 0.5) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Génère la configuration du serveur basée sur les ports détectés
   */
  private static generateServerConfig(ports: ProcessedPortInfo[]): Array<{
    component: string;
    status: 'ok' | 'warning' | 'critical';
    details: string;
  }> {
    const config: Array<{
      component: string;
      status: 'ok' | 'warning' | 'critical';
      details: string;
    }> = [];
    const openPorts = ports.filter(p => p.status === 'open');
    
    // Analyse HTTP/HTTPS
    const httpPort = openPorts.find(p => p.port === 80);
    const httpsPort = openPorts.find(p => p.port === 443);
    
    if (httpPort) {
      config.push({
        component: 'Serveur HTTP',
        status: httpsPort ? 'warning' : 'critical',
        details: httpsPort ? 
          'HTTP disponible mais HTTPS recommandé pour la sécurité' : 
          'HTTP non sécurisé détecté - HTTPS fortement recommandé'
      });
    }
    
    if (httpsPort) {
      config.push({
        component: 'Serveur HTTPS',
        status: 'ok',
        details: 'HTTPS correctement configuré'
      });
    }
    
    // Analyse SSH
    const sshPort = openPorts.find(p => p.port === 22);
    if (sshPort) {
      config.push({
        component: 'SSH',
        status: 'warning',
        details: 'SSH accessible - vérifiez la configuration de sécurité'
      });
    }
    
    // Analyse des bases de données
    const dbPorts = openPorts.filter(p => [3306, 5432, 1433, 27017].includes(p.port));
    dbPorts.forEach(port => {
      config.push({
        component: `Base de données (Port ${port.port})`,
        status: 'critical',
        details: 'Base de données accessible publiquement - risque de sécurité élevé'
      });
    });
    
    // Analyse FTP
    const ftpPort = openPorts.find(p => p.port === 21);
    if (ftpPort) {
      config.push({
        component: 'FTP',
        status: 'critical',
        details: 'FTP non sécurisé détecté - utilisez SFTP ou FTPS'
      });
    }
    
    return config;
  }

  /**
   * Analyse la configuration du pare-feu
   */
  private static analyzeFirewall(ports: ProcessedPortInfo[]): {
    status: 'enabled' | 'disabled' | 'partial';
    type: string;
    message: string;
  } {
    const filteredPorts = ports.filter(p => p.status === 'filtered');
    const openPorts = ports.filter(p => p.status === 'open');
    const totalPorts = ports.length;
    
    const filteredRatio = filteredPorts.length / totalPorts;
    
    if (filteredRatio > 0.7) {
      return {
        status: 'enabled',
        type: 'Pare-feu actif avec filtrage strict',
        message: 'Le pare-feu est actif et correctement configuré. Tous les ports inutiles sont bloqués.'
      };
    } else if (filteredRatio > 0.3) {
      return {
        status: 'partial',
        type: 'Pare-feu partiellement configuré',
        message: 'Le pare-feu est partiellement configuré. Certaines règles sont en place mais un renforcement supplémentaire est recommandé.'
      };
    } else {
      return {
        status: 'disabled',
        type: 'Pare-feu non détecté ou désactivé',
        message: 'Le pare-feu est désactivé. Cela représente un risque de sécurité important car tous les ports sont potentiellement accessibles.'
      };
    }
  }
}
