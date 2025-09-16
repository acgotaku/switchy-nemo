export default {
  common: {
    title: 'Switchy Nemo',
    action: '操作',
    close: '关闭',
    create: '创建',
    delete: '删除',
    cancel: '取消',
    update: '更新'
  },
  layouts: {
    sidebar: {
      settings: '设置',
      profiles: '模式'
    }
  },
  views: {
    about: {
      title: '关于',
      description: 'Switchy Nemo 是一个用于浏览器的代理管理工具。',
      version: '版本 {{version}}'
    },
    general: {
      title: '通用',
      profiles: '模式',
      profilesDesc:
        '模式用于管理不同的代理服务器。您可以对模式进行排序和禁用。',
      languages: '语言'
    },
    transfer: {
      title: '导入/导出',
      settings: '设置',
      backup: '备份设置',
      backupDesc: '创建选项的完整备份（包括配置文件和所有其他选项）。',
      restore: '恢复设置',
      restoreDesc: '从本地文件恢复您的Switchy Nemo选项。',
      restoreSuccess: '设置已成功恢复！',
      restoreError: '恢复设置失败。请检查文件格式。'
    },
    profile: {
      title: '模式 {{name}}',
      new: '新建模式',
      edit: '编辑模式',
      delete: '删除模式',
      deleteConfirmation: '您真的想删除以下模式吗？',
      servers: '代理服务器',
      name: '模式名称',
      proxyRules: '代理规则',
      scheme: '协议',
      host: '服务器',
      port: '端口',
      username: '用户名',
      password: '密码',
      bypassList: '绕过列表',
      bypassListDesc: '不想使用代理的服务器: (每行一个服务器)',
      bypassListLink: '(支持通配符等…)'
    }
  },
  validation: {
    required: '{{field}}是必填的。'
  }
};
