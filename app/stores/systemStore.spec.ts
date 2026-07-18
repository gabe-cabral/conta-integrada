import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import useSystemStore from './systemStore';

describe('systemStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('estado inicial', () => {
    it('deve inicializar com valores padrão', () => {
      const store = useSystemStore();

      expect(store.pageTitle).toBeUndefined();
      expect(store.ctaButton).toBeUndefined();
      expect(store.toasts).toEqual([]);
    });
  });

  describe('setTitle', () => {
    it('deve definir o título da página', () => {
      const store = useSystemStore();

      store.setTitle('Meu Título');

      expect(store.pageTitle).toBe('Meu Título');
    });

    it('deve permitir definir título como undefined', () => {
      const store = useSystemStore();

      store.setTitle('Título');
      store.setTitle(undefined);

      expect(store.pageTitle).toBeUndefined();
    });
  });

  describe('setCallToAction', () => {
    it('deve definir o botão de call to action', () => {
      const store = useSystemStore();
      const cta = {
        label: 'Novo Cliente',
        icon: 'bi-plus-lg',
        route: { name: 'client', params: { id: 'new' } },
      };

      store.setCallToAction(cta);

      expect(store.ctaButton).toEqual(cta);
    });

    it('deve definir call to action sem ícone', () => {
      const store = useSystemStore();
      const cta = {
        label: 'Ação',
        route: { name: 'home' },
      };

      store.setCallToAction(cta);

      expect(store.ctaButton?.label).toBe('Ação');
      expect(store.ctaButton?.icon).toBeUndefined();
    });
  });

  describe('addMessage', () => {
    it('deve adicionar uma mensagem toast', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem de teste', 'Título');

      expect(store.toasts).toHaveLength(1);
      expect(store.toasts[0]!.title).toBe('Título');
      expect(store.toasts[0]!.message).toBe('Mensagem de teste');
      expect(store.toasts[0]!.id).toBeDefined();
    });

    it('deve adicionar mensagem com tipo e ícone', () => {
      const store = useSystemStore();

      store.addMessage('Sucesso!', 'Operação concluída', 'success', 'bi-check');

      expect(store.toasts[0]!.type).toBe('success');
      expect(store.toasts[0]!.icon).toBe('bi-check');
    });

    it('deve remover mensagem automaticamente após o tempo especificado', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem temporária', 'Título', 'info', undefined, 3);

      expect(store.toasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);

      expect(store.toasts).toHaveLength(0);
    });

    it('não deve remover mensagem se seconds for 0', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem permanente', 'Título', 'info', undefined, 0);

      expect(store.toasts).toHaveLength(1);

      vi.advanceTimersByTime(5000);

      expect(store.toasts).toHaveLength(1);
    });

    it('não deve remover mensagem se seconds for negativo', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem permanente', 'Título', 'info', undefined, -1);

      expect(store.toasts).toHaveLength(1);

      vi.advanceTimersByTime(5000);

      expect(store.toasts).toHaveLength(1);
    });

    it('não deve remover mensagem se seconds não for fornecido', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem permanente', 'Título');

      expect(store.toasts).toHaveLength(1);

      vi.advanceTimersByTime(5000);

      expect(store.toasts).toHaveLength(1);
    });

    it('deve adicionar múltiplas mensagens', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem 1', 'Título 1');
      store.addMessage('Mensagem 2', 'Título 2');
      store.addMessage('Mensagem 3', 'Título 3');

      expect(store.toasts).toHaveLength(3);
    });
  });

  describe('removeMessage', () => {
    it('deve remover mensagem pelo id', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem 1', 'Título 1');
      store.addMessage('Mensagem 2', 'Título 2');

      const idToRemove = store.toasts[0]!.id;

      store.removeMessage(idToRemove);

      expect(store.toasts).toHaveLength(1);
      expect(store.toasts[0]!.title).toBe('Título 2');
    });

    it('não deve fazer nada se o id não existir', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem', 'Título');

      store.removeMessage('id-inexistente');

      expect(store.toasts).toHaveLength(1);
    });

    it('deve remover mensagem do meio da lista', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem 1', 'Título 1');
      store.addMessage('Mensagem 2', 'Título 2');
      store.addMessage('Mensagem 3', 'Título 3');

      const idToRemove = store.toasts[1]!.id;

      store.removeMessage(idToRemove);

      expect(store.toasts).toHaveLength(2);
      expect(store.toasts[0]!.title).toBe('Título 1');
      expect(store.toasts[1]!.title).toBe('Título 3');
    });
  });

  describe('addResultErrorMessage', () => {
    it('deve adicionar mensagem de erro com título e mensagem padrão', () => {
      const store = useSystemStore();
      const result = { ok: false };

      store.addResultErrorMessage(result);

      expect(store.toasts).toHaveLength(1);
      expect(store.toasts[0]!.title).toBe('Aconteceu um erro');
      expect(store.toasts[0]!.message).toBe('Ocorreu um erro desconhecido na solicitação.');
      expect(store.toasts[0]!.type).toBe('danger');
      expect(store.toasts[0]!.icon).toBe('bi-exclamation-diamond');
    });

    it('deve usar título customizado quando fornecido', () => {
      const store = useSystemStore();
      const result = { ok: false };

      store.addResultErrorMessage(result, 'Erro ao salvar');

      expect(store.toasts[0]!.title).toBe('Erro ao salvar');
    });

    it('deve processar invalid-params quando presente', () => {
      const store = useSystemStore();
      const result = {
        'ok': false,
        'invalid-params': [
          { name: 'email', reason: 'Email inválido' },
          { name: 'senha', reason: 'Senha muito curta' },
        ],
      };

      store.addResultErrorMessage(result);

      expect(store.toasts[0]!.title).toBe('Campos inválidos: email, senha');
      expect(store.toasts[0]!.message).toBe('email: Email inválido\nsenha: Senha muito curta');
    });

    it('deve processar errors quando presente', () => {
      const store = useSystemStore();
      const result = {
        ok: false,
        errors: [
          { title: 'Erro de validação', detail: 'Dados inválidos', status: 400 },
          { title: 'Erro de permissão', detail: 'Acesso negado', status: 401 },
        ],
      };

      store.addResultErrorMessage(result);

      expect(store.toasts[0]!.title).toBe('Erro de validação, Erro de permissão');
      expect(store.toasts[0]!.message).toBe('Dados inválidos\nAcesso negado');
    });

    it('deve priorizar invalid-params sobre errors', () => {
      const store = useSystemStore();
      const result = {
        'ok': false,
        'invalid-params': [{ name: 'campo', reason: 'Motivo' }],
        'errors': [{ title: 'Erro', detail: 'Detalhe', status: 400 }],
      };

      store.addResultErrorMessage(result);

      expect(store.toasts[0]!.title).toBe('Campos inválidos: campo');
      expect(store.toasts[0]!.message).toBe('campo: Motivo');
    });

    it('deve processar invalid-params com um único item', () => {
      const store = useSystemStore();
      const result = {
        'ok': false,
        'invalid-params': [{ name: 'cpf', reason: 'CPF inválido' }],
      };

      store.addResultErrorMessage(result);

      expect(store.toasts[0]!.title).toBe('Campos inválidos: cpf');
      expect(store.toasts[0]!.message).toBe('cpf: CPF inválido');
    });

    it('deve processar errors com um único item', () => {
      const store = useSystemStore();
      const result = {
        ok: false,
        errors: [{ title: 'Erro único', detail: 'Detalhe único', status: 400 }],
      };

      store.addResultErrorMessage(result);

      expect(store.toasts[0]!.title).toBe('Erro único');
      expect(store.toasts[0]!.message).toBe('Detalhe único');
    });
  });

  describe('clearStore', () => {
    it('deve limpar a store e definir título padrão', () => {
      const store = useSystemStore();

      store.setTitle('Título Customizado');
      store.setCallToAction({
        label: 'Ação',
        route: { name: 'home' },
      });

      store.clearStore();

      expect(store.pageTitle).toBe('Início');
      expect(store.ctaButton).toBeUndefined();
    });

    it('não deve limpar os toasts', () => {
      const store = useSystemStore();

      store.addMessage('Mensagem', 'Título');
      store.clearStore();

      expect(store.toasts).toHaveLength(1);
    });
  });
});
