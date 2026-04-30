package com.maka.hr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HrApplication {

    public static void main(String[] args) {
        System.out.println("=== Démarrage du Module HR (Ressources Humaines) ===");
        SpringApplication.run(HrApplication.class, args);
    }
}
