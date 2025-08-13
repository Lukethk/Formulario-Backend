import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Brigada {
  id: number;
  nombre: string;
  cant_bomberos_activos?: number;
  contacto_comandante?: string;
  encargado_logistica?: string;
  contacto_logistica?: string;
  num_emergencia?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

export interface Equipo {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  created_at: string;
  categoria_nombre?: string;
}

export interface Talla {
  id: number;
  nombre: string;
  tipo?: string;
  created_at: string;
}

export interface EquipoBrigada {
  id: number;
  brigada_id: number;
  equipo_id: number;
  talla_id?: number;
  cantidad: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  brigada_nombre?: string;
  equipo_nombre?: string;
  talla_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Brigadas
  getBrigadas(): Observable<Brigada[]> {
    return this.http.get<Brigada[]>(`${this.baseUrl}/brigadas`);
  }

  getBrigada(id: number): Observable<Brigada> {
    return this.http.get<Brigada>(`${this.baseUrl}/brigadas/${id}`);
  }

  createBrigada(brigada: Partial<Brigada>): Observable<Brigada> {
    return this.http.post<Brigada>(`${this.baseUrl}/brigadas`, brigada);
  }

  updateBrigada(id: number, brigada: Partial<Brigada>): Observable<Brigada> {
    return this.http.put<Brigada>(`${this.baseUrl}/brigadas/${id}`, brigada);
  }

  deleteBrigada(id: number): Observable<Brigada> {
    return this.http.delete<Brigada>(`${this.baseUrl}/brigadas/${id}`);
  }

  // Categorías
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  getCategoria(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseUrl}/categorias/${id}`);
  }

  createCategoria(categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.baseUrl}/categorias`, categoria);
  }

  updateCategoria(id: number, categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/categorias/${id}`, categoria);
  }

  deleteCategoria(id: number): Observable<Categoria> {
    return this.http.delete<Categoria>(`${this.baseUrl}/categorias/${id}`);
  }

  // Equipos
  getEquipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.baseUrl}/equipos`);
  }

  getEquipo(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.baseUrl}/equipos/${id}`);
  }

  createEquipo(equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.post<Equipo>(`${this.baseUrl}/equipos`, equipo);
  }

  updateEquipo(id: number, equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.baseUrl}/equipos/${id}`, equipo);
  }

  deleteEquipo(id: number): Observable<Equipo> {
    return this.http.delete<Equipo>(`${this.baseUrl}/equipos/${id}`);
  }

  // Tallas
  getTallas(): Observable<Talla[]> {
    return this.http.get<Talla[]>(`${this.baseUrl}/tallas`);
  }

  getTalla(id: number): Observable<Talla> {
    return this.http.get<Talla>(`${this.baseUrl}/tallas/${id}`);
  }

  createTalla(talla: Partial<Talla>): Observable<Talla> {
    return this.http.post<Talla>(`${this.baseUrl}/tallas`, talla);
  }

  updateTalla(id: number, talla: Partial<Talla>): Observable<Talla> {
    return this.http.put<Talla>(`${this.baseUrl}/tallas/${id}`, talla);
  }

  deleteTalla(id: number): Observable<Talla> {
    return this.http.delete<Talla>(`${this.baseUrl}/tallas/${id}`);
  }

  // Equipos por Brigada
  getEquiposBrigada(): Observable<EquipoBrigada[]> {
    return this.http.get<EquipoBrigada[]>(`${this.baseUrl}/equipos-brigada`);
  }

  getEquiposBrigadaByBrigada(brigadaId: number): Observable<EquipoBrigada[]> {
    return this.http.get<EquipoBrigada[]>(`${this.baseUrl}/equipos-brigada/brigada/${brigadaId}`);
  }

  createEquipoBrigada(equipoBrigada: Partial<EquipoBrigada>): Observable<EquipoBrigada> {
    return this.http.post<EquipoBrigada>(`${this.baseUrl}/equipos-brigada`, equipoBrigada);
  }

  updateEquipoBrigada(id: number, equipoBrigada: Partial<EquipoBrigada>): Observable<EquipoBrigada> {
    return this.http.put<EquipoBrigada>(`${this.baseUrl}/equipos-brigada/${id}`, equipoBrigada);
  }

  deleteEquipoBrigada(id: number): Observable<EquipoBrigada> {
    return this.http.delete<EquipoBrigada>(`${this.baseUrl}/equipos-brigada/${id}`);
  }
}
