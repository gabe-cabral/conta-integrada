import { defineStore } from 'pinia';

import type { BaseResponse } from '../models/base/BaseResponseModel';
import type { RouteLocationAsRelativeGeneric } from 'vue-router';

export interface CallToAction {
  label: string
  icon?: string
  route: RouteLocationAsRelativeGeneric
}

export type ToastTheme = 'success' | 'danger' | 'warning' | 'info' | 'primary';

interface ToastAlert {
  id: string
  title: string
  message: string
  type?: ToastTheme
  icon?: string
}

interface SystemState {
  pageTitle: string | undefined
  ctaButton: CallToAction | undefined
  toasts: ToastAlert[]
  defaultCurrency: string
}

const useSystemStore = defineStore('system', {
  state: () =>
    ({
      pageTitle: undefined,
      ctaButton: undefined,
      toasts: [] as ToastAlert[],
      defaultCurrency: 'BRL',
    }) as SystemState,

  getters: {},

  actions: {
    setDefaultCurrency(currency: string) {
      this.defaultCurrency = currency;
    },

    setTitle(title?: string) {
      this.pageTitle = title;
    },

    setCallToAction(cta: CallToAction) {
      this.ctaButton = cta;
    },

    addMessage(message: string, title: string, type?: ToastTheme, icon?: string, seconds?: number) {
      const toastId = crypto.randomUUID();

      this.toasts.push({
        id: toastId,
        title,
        message,
        type,
        icon,
      });

      if (Number.isFinite(seconds) && seconds! > 0) {
        setTimeout(() => {
          this.removeMessage(toastId);
        }, seconds! * 1000);
      }
    },

    addResultErrorMessage(
      result: BaseResponse<object>,
      defaultTitle: string = 'Aconteceu um erro',
    ) {
      let title = defaultTitle;
      let message = 'Ocorreu um erro desconhecido na solicitação.';

      if (Array.isArray(result['invalid-params'])) {
        title = `Campos inválidos: ${result['invalid-params'].map((i) => i.name).join(', ')}`;
        message = result['invalid-params'].map((i) => `${i.name}: ${i.reason}`).join('\n');
      } else if (Array.isArray(result.errors)) {
        title = result.errors.map((e) => e.title).join(', ');
        message = result.errors.map((e) => e.detail).join('\n');
      }

      this.addMessage(message, title, 'danger', 'bi-exclamation-diamond');
    },

    removeMessage(id: string) {
      const index = this.toasts.findIndex((t) => t.id === id);

      if (index >= 0) {
        this.toasts.splice(index, 1);
      }
    },

    clearStore() {
      this.pageTitle = 'Início';
      this.ctaButton = undefined;
      this.toasts = [];
      this.defaultCurrency = 'BRL';
    },
  },
});

export default useSystemStore;
