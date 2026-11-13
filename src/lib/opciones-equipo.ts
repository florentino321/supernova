// Opciones de los selects del formulario de equipos. Si un equipo trae algo que no está
// en la lista, se elige "Otro…" y se escribe; lo que ya se registró antes aparece también.

export const PROCESADORES: [grupo: string, opciones: string[]][] = [
  [
    "Intel Core",
    [
      "Intel Core i3 (8.ª gen)", "Intel Core i3 (10.ª gen)", "Intel Core i3 (11.ª gen)", "Intel Core i3 (12.ª gen)", "Intel Core i3 (13.ª gen)",
      "Intel Core i5 (8.ª gen)", "Intel Core i5 (10.ª gen)", "Intel Core i5 (11.ª gen)", "Intel Core i5 (12.ª gen)", "Intel Core i5 (13.ª gen)",
      "Intel Core i7 (8.ª gen)", "Intel Core i7 (10.ª gen)", "Intel Core i7 (11.ª gen)", "Intel Core i7 (12.ª gen)", "Intel Core i7 (13.ª gen)",
      "Intel Core i9 (12.ª gen)", "Intel Core i9 (13.ª gen)", "Intel Core i9 (14.ª gen)",
    ],
  ],
  ["Intel Core Ultra", ["Intel Core Ultra 5", "Intel Core Ultra 7", "Intel Core Ultra 9"]],
  ["Intel (otros)", ["Intel Celeron", "Intel Pentium", "Intel Xeon"]],
  [
    "AMD Ryzen",
    [
      "AMD Ryzen 3 (serie 5000)", "AMD Ryzen 3 (serie 7000)",
      "AMD Ryzen 5 (serie 3000)", "AMD Ryzen 5 (serie 5000)", "AMD Ryzen 5 (serie 7000)",
      "AMD Ryzen 7 (serie 3000)", "AMD Ryzen 7 (serie 5000)", "AMD Ryzen 7 (serie 7000)",
      "AMD Ryzen 9 (serie 5000)", "AMD Ryzen 9 (serie 7000)", "AMD Ryzen AI",
    ],
  ],
  ["Apple", ["Apple M1", "Apple M1 Pro", "Apple M2", "Apple M2 Pro", "Apple M3", "Apple M3 Pro", "Apple M4"]],
];

export const RAMS = [4, 8, 12, 16, 24, 32, 64];

export const ALMACENAMIENTOS = [
  "128 GB SSD", "256 GB SSD", "512 GB SSD", "1 TB SSD", "2 TB SSD",
  "256 GB SSD + 1 TB HDD", "512 GB SSD + 1 TB HDD", "500 GB HDD", "1 TB HDD",
];

export const GPUS: [grupo: string, opciones: string[]][] = [
  ["Integrada", ["Gráficos integrados Intel", "Gráficos integrados AMD Radeon", "Gráficos integrados Apple"]],
  [
    "NVIDIA",
    [
      "NVIDIA GeForce MX", "NVIDIA GeForce GTX 1650", "NVIDIA GeForce GTX 1660 Ti",
      "NVIDIA GeForce RTX 2050", "NVIDIA GeForce RTX 2060", "NVIDIA GeForce RTX 2070",
      "NVIDIA GeForce RTX 3050", "NVIDIA GeForce RTX 3050 Ti", "NVIDIA GeForce RTX 3060", "NVIDIA GeForce RTX 3070", "NVIDIA GeForce RTX 3080",
      "NVIDIA GeForce RTX 4050", "NVIDIA GeForce RTX 4060", "NVIDIA GeForce RTX 4070", "NVIDIA GeForce RTX 4080", "NVIDIA GeForce RTX 4090",
      "NVIDIA RTX (workstation)",
    ],
  ],
  ["AMD", ["AMD Radeon RX (dedicada)"]],
];

export const PANTALLAS = [11.6, 12.5, 13.3, 13.6, 14, 15.6, 16, 17.3];
