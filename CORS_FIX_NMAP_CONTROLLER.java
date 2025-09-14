package com.monsite.monsite.Controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.monsite.monsite.Services.NmapService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/nmap")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class NmapController {

  private final NmapService nmapService;

  public NmapController(NmapService nmapService) {
    this.nmapService = nmapService;
  }

  @PostMapping("/scan")
  @CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
  public ResponseEntity<?> scanPost(@RequestBody Map<String, String> body) {
    try {
      String url = body.get("url");
      String ports = body.getOrDefault("ports", "1-1024"); // ports par défaut si absent

      if (url == null || url.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of(
          "error", "URL is required"
        ));
      }

      JsonNode result = nmapService.scanUrlToJson(url, ports);
      return ResponseEntity.ok(result);

    } catch (Exception e) {
      e.printStackTrace(); // pour debug
      return ResponseEntity.status(500).body(Map.of(
        "error", "Scan failed",
        "details", e.getMessage()
      ));
    }
  }
}
