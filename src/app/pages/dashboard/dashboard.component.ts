import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = {
    brigadas: 0,
    equipos: 0,
    categorias: 0,
    tallas: 0
  };

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    // Cargar estadísticas básicas
    this.apiService.getBrigadas().subscribe(brigadas => {
      this.stats.brigadas = brigadas.length;
    });

    this.apiService.getEquipos().subscribe(equipos => {
      this.stats.equipos = equipos.length;
    });

    this.apiService.getCategorias().subscribe(categorias => {
      this.stats.categorias = categorias.length;
    });

    this.apiService.getTallas().subscribe(tallas => {
      this.stats.tallas = tallas.length;
    });
  }
}
