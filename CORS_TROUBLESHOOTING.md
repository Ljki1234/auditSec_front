# 🔧 Résolution des Erreurs CORS - Nmap API

## 🚨 Problème Identifié
```
Access to XMLHttpRequest at 'http://localhost:8080/api/nmap/scan' from origin 'http://localhost:4200' has been blocked by CORS policy
```

## ✅ Solutions Implémentées

### 1. **Utilisation du Proxy Angular (Recommandée)**

Le service nmap a été modifié pour utiliser le proxy Angular au lieu de l'URL directe :

**Avant :**
```typescript
private readonly baseUrl = 'http://localhost:8080/api/nmap';
```

**Après :**
```typescript
private readonly baseUrl = '/api/nmap';
```

### 2. **Redémarrage Nécessaire**

**IMPORTANT :** Vous devez redémarrer votre serveur de développement Angular pour que le proxy prenne effet :

```bash
# Arrêtez le serveur Angular (Ctrl+C)
# Puis relancez-le :
ng serve
# ou
npm start
```

### 3. **Vérification du Proxy**

Le fichier `proxy.conf.json` est déjà configuré :
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Et `angular.json` est configuré pour l'utiliser :
```json
"serve": {
  "configurations": {
    "development": {
      "proxyConfig": "proxy.conf.json"
    }
  }
}
```

## 🔍 Vérifications

### 1. **Vérifier que le Backend est Démarré**
```bash
# Vérifiez que votre backend Spring Boot est bien démarré sur le port 8080
curl http://localhost:8080/api/nmap/scan -X POST -H "Content-Type: application/json" -d '{"url":"http://testphp.vulnweb.com/"}'
```

### 2. **Vérifier les Logs du Proxy**
Avec `"logLevel": "debug"`, vous devriez voir des logs dans la console Angular indiquant les requêtes proxy.

### 3. **Test Direct dans le Navigateur**
Après redémarrage, testez l'audit infrastructure avec une URL comme `http://testphp.vulnweb.com/`

## 🛠️ Solutions Alternatives (si le proxy ne fonctionne pas)

### Option A : Ajouter @CrossOrigin au Contrôleur
```java
@RestController
@RequestMapping("/api/nmap")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class NmapController {
    // ... votre code existant
}
```

### Option B : Améliorer la Configuration CORS Globale
Remplacez votre `CorsConfig.java` par la version améliorée qui inclut :
- `allowedOriginPatterns("*")` pour plus de flexibilité
- `exposedHeaders("*")` pour exposer tous les headers
- Support de plus de méthodes HTTP

## 🧪 Test de Validation

1. **Redémarrez Angular** : `ng serve`
2. **Allez sur** : `http://localhost:4200/infrastructure-audit`
3. **Entrez une URL** : `http://testphp.vulnweb.com/`
4. **Cliquez sur** : "Lancer l'Audit"
5. **Vérifiez** : Les ports devraient s'afficher sans erreur CORS

## 📝 Logs à Surveiller

### Console Angular (F12)
- Plus d'erreurs CORS
- Logs du proxy (avec `logLevel: debug`)

### Console Backend
- Requêtes POST vers `/api/nmap/scan`
- Réponses JSON avec les données nmap

## 🚀 Résultat Attendu

Après ces modifications, vous devriez voir :
- ✅ Plus d'erreurs CORS
- ✅ Appel API réussi vers `/api/nmap/scan`
- ✅ Affichage des ports scannés dans l'interface
- ✅ Score de sécurité calculé automatiquement

## 🔄 Si le Problème Persiste

1. Vérifiez que le backend est bien démarré
2. Vérifiez les logs du backend pour des erreurs
3. Testez l'API directement avec curl ou Postman
4. Vérifiez que le port 8080 n'est pas bloqué par un firewall
