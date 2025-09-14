package com.monsite.monsite.Controller;

import com.monsite.monsite.Models.ConfigurationResult;
import com.monsite.monsite.Services.ConfigurationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/configuration")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"}, 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowedHeaders = "*",
             allowCredentials = "true")
public class ConfigurationController {

  private final ConfigurationService configurationService;

  public ConfigurationController(ConfigurationService configurationService) {
    this.configurationService = configurationService;
  }

  @GetMapping
  public List<ConfigurationResult> checkConfiguration(@RequestParam String url) {
    return configurationService.checkConfiguration(url);
  }
}
