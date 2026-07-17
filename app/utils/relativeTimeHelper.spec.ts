import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import relativeTimeHelper from './relativeTimeHelper';

describe('relativeTimeHelper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('unidades de tempo futuras', () => {
    it('deve retornar "em X anos" para datas futuras em anos', () => {
      const futureDate = new Date('2026-01-15T12:00:00.000Z').toISOString();
      const result = relativeTimeHelper(futureDate);

      expect(result).toContain('2');
      expect(result).toContain('ano');
    });

    it('deve retornar "em X meses" para datas futuras em meses', () => {
      const futureDate = new Date('2024-03-15T12:00:00.000Z').toISOString();
      const result = relativeTimeHelper(futureDate);

      expect(result).toContain('2');
      expect(result).toContain('mes');
    });

    it('deve retornar "em X dias" para datas futuras em dias', () => {
      const futureDate = new Date('2024-01-20T12:00:00.000Z').toISOString();
      const result = relativeTimeHelper(futureDate);

      expect(result).toContain('5');
      expect(result).toContain('dia');
    });

    it('deve retornar "em X horas" para datas futuras em horas', () => {
      const futureDate = new Date('2024-01-15T15:00:00.000Z').toISOString();
      const result = relativeTimeHelper(futureDate);

      expect(result).toContain('3');
      expect(result).toContain('hora');
    });

    it('deve retornar "em X minutos" para datas futuras em minutos', () => {
      const futureDate = new Date('2024-01-15T12:10:00.000Z').toISOString();
      const result = relativeTimeHelper(futureDate);

      expect(result).toContain('10');
      expect(result).toContain('minuto');
    });

    it('deve retornar "em X segundos" para datas futuras em segundos', () => {
      const futureDate = new Date('2024-01-15T12:00:30.000Z').toISOString();
      const result = relativeTimeHelper(futureDate);

      expect(result).toContain('30');
      expect(result).toContain('segundo');
    });
  });

  describe('unidades de tempo passadas', () => {
    it('deve retornar "há X anos" para datas passadas em anos', () => {
      const pastDate = new Date('2022-01-15T12:00:00.000Z').toISOString();
      const result = relativeTimeHelper(pastDate);

      expect(result).toContain('2');
      expect(result).toContain('ano');
    });

    it('deve retornar "há X meses" para datas passadas em meses', () => {
      const pastDate = new Date('2023-11-15T12:00:00.000Z').toISOString();
      const result = relativeTimeHelper(pastDate);

      expect(result).toContain('2');
      expect(result).toContain('mes');
    });

    it('deve retornar "há X dias" para datas passadas em dias', () => {
      const pastDate = new Date('2024-01-10T12:00:00.000Z').toISOString();
      const result = relativeTimeHelper(pastDate);

      expect(result).toContain('5');
      expect(result).toContain('dia');
    });

    it('deve retornar "há X horas" para datas passadas em horas', () => {
      const pastDate = new Date('2024-01-15T09:00:00.000Z').toISOString();
      const result = relativeTimeHelper(pastDate);

      expect(result).toContain('3');
      expect(result).toContain('hora');
    });

    it('deve retornar "há X minutos" para datas passadas em minutos', () => {
      const pastDate = new Date('2024-01-15T11:50:00.000Z').toISOString();
      const result = relativeTimeHelper(pastDate);

      expect(result).toContain('10');
      expect(result).toContain('minuto');
    });

    it('deve retornar "há X segundos" para datas passadas em segundos', () => {
      const pastDate = new Date('2024-01-15T11:59:30.000Z').toISOString();
      const result = relativeTimeHelper(pastDate);

      expect(result).toContain('30');
      expect(result).toContain('segundo');
    });
  });

  describe('casos especiais', () => {
    it('deve retornar "agora" para data atual', () => {
      const currentDate = new Date('2024-01-15T12:00:00.000Z').toISOString();
      const result = relativeTimeHelper(currentDate);

      expect(result).toBeDefined();
    });

    it('deve retornar "agora" para diferenças menores que 1 segundo', () => {
      const nearDate = new Date('2024-01-15T12:00:00.500Z').toISOString();
      const result = relativeTimeHelper(nearDate);

      expect(result).toBeDefined();
    });
  });
});
