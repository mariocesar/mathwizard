import { describe, expect, it } from 'vitest';
import { enPalabras, hechoEnPalabras } from './numeros';

describe('enPalabras', () => {
  it('cubre los casos con tilde', () => {
    expect(enPalabras(16)).toBe('dieciséis');
    expect(enPalabras(22)).toBe('veintidós');
    expect(enPalabras(23)).toBe('veintitrés');
    expect(enPalabras(26)).toBe('veintiséis');
  });

  it('cubre extremos y compuestos', () => {
    expect(enPalabras(0)).toBe('cero');
    expect(enPalabras(15)).toBe('quince');
    expect(enPalabras(21)).toBe('veintiuno');
    expect(enPalabras(30)).toBe('treinta');
    expect(enPalabras(31)).toBe('treinta y uno');
    expect(enPalabras(56)).toBe('cincuenta y seis');
    expect(enPalabras(99)).toBe('noventa y nueve');
    expect(enPalabras(100)).toBe('cien');
  });

  it('tabla exhaustiva 0–100: nunca lanza, nunca vacío, sin dígitos', () => {
    for (let n = 0; n <= 100; n++) {
      const palabra = enPalabras(n);
      expect(palabra.length).toBeGreaterThan(0);
      expect(palabra).not.toMatch(/\d/);
    }
  });

  it('lanza fuera de rango', () => {
    expect(() => enPalabras(-1)).toThrow();
    expect(() => enPalabras(101)).toThrow();
    expect(() => enPalabras(3.5)).toThrow();
  });

  it('hechoEnPalabras produce la cadena verbal completa', () => {
    expect(hechoEnPalabras(7, 8)).toBe('siete por ocho, cincuenta y seis');
    expect(hechoEnPalabras(10, 10)).toBe('diez por diez, cien');
  });
});
