import { defineConfig, UserManifest } from 'wxt';
import { version } from './package.json';
import svgr from 'vite-plugin-svgr';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  react: {
    vite: {
      babel: {
        plugins: [['@babel/plugin-proposal-decorators', { version: '2023-05' }]]
      }
    }
  },
  manifestVersion: 3,
  alias: {
    '@options': './entrypoints/options'
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  manifest: env => {
    const manifest: UserManifest = {
      // languages https://developer.chrome.com/docs/extensions/reference/api/i18n?hl=zh-cn#locales
      name: '__MSG_appName__',
      version: version,
      description: '__MSG_description__',
      default_locale: 'en',
      permissions: [
        'activeTab',
        'storage',
        'proxy',
        'webRequest',
        'webRequestAuthProvider'
      ],
      web_accessible_resources: [],
      action: {
        default_icon: {
          '16': 'icon/nemo16.png',
          '32': 'icon/nemo32.png',
          '48': 'icon/nemo48.png',
          '96': 'icon/nemo96.png',
          '128': 'icon/nemo128.png'
        }
      },
      host_permissions: ['<all_urls>']
    };
    return manifest;
  },
  vite: () => ({
    plugins: [svgr()]
  })
});
