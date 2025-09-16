export default {
  common: {
    title: 'Switchy Nemo',
    action: 'アクション',
    close: '閉じる',
    create: '作成',
    delete: '削除',
    cancel: 'キャンセル',
    update: '更新'
  },
  layouts: {
    sidebar: {
      settings: '設定',
      profiles: 'プロファイル'
    }
  },
  views: {
    about: {
      title: '概要',
      description: 'Switchy Nemo はブラウザ用のプロキシ管理ツールです。',
      version: 'バージョン {{version}}'
    },
    general: {
      title: '一般',
      profiles: 'プロファイル',
      profilesDesc:
        'プロファイルは異なるプロキシサーバーを管理するために使用されます。プロファイルを並べ替えたり、無効にしたりできます。',
      languages: '言語'
    },
    transfer: {
      title: 'インポート/エクスポート',
      settings: '設定',
      backup: 'バックアップ設定',
      backupDesc:
        'オプションの完全バックアップを作成します（プロファイルやその他のすべてのオプションを含む）。',
      restore: '復元設定',
      restoreDesc: 'ローカルファイルからSwitchy Nemoのオプションを復元します。',
      restoreSuccess: '設定が正常に復元されました！',
      restoreError: '設定の復元に失敗しました。ファイル形式を確認してください。'
    },
    profile: {
      title: 'プロファイル {{name}}',
      new: '新しいプロファイル',
      edit: 'プロファイルを編集',
      delete: 'プロファイルを削除',
      deleteConfirmation: '本当に以下のプロファイルを削除しますか？',
      servers: 'プロキシサーバー',
      name: 'プロファイル名',
      proxyRules: 'プロキシルール',
      scheme: 'スキーム',
      host: 'サーバー',
      port: 'ポート',
      username: 'ユーザー名',
      password: 'パスワード',
      bypassList: 'バイパスリスト',
      bypassListDesc: 'プロキシを使用したくないサーバー: (各行に1つのサーバー)',
      bypassListLink: '(ワイルドカードなどが利用可能です…)'
    }
  },
  validation: {
    required: '{{field}}は必須です。'
  }
};
