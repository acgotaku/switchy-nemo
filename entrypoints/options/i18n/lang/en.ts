export default {
  common: {
    title: 'Switchy Nemo',
    action: 'Action',
    close: 'Close',
    create: 'Create',
    delete: 'Delete',
    cancel: 'Cancel',
    update: 'Update'
  },
  layouts: {
    sidebar: {
      settings: 'Settings',
      profiles: 'Profiles'
    }
  },
  views: {
    about: {
      title: 'About',
      description: 'Switchy Nemo is a proxy management tool for Browsers.',
      version: 'Version {{version}}'
    },
    general: {
      title: 'General',
      profiles: 'Profiles',
      profilesDesc:
        'Profiles are used to manage different proxy servers. You can sort and disable profiles.',
      languages: 'Languages'
    },
    transfer: {
      title: 'Import/Export',
      settings: 'Settings',
      backup: 'Backup Settings',
      backupDesc:
        'Make a full backup of your options (including profiles and all other options).',
      restore: 'Restore Settings',
      restoreDesc: 'Restore your Switchy Nemo options from a local file.',
      restoreSuccess: 'Settings restored successfully!',
      restoreError: 'Failed to restore settings. Please check the file format.'
    },
    profile: {
      title: 'Profile {{name}}',
      new: 'New Profile',
      edit: 'Edit Profile',
      delete: 'Delete Profile',
      deleteConfirmation: 'Do you really want to delete the following profile?',
      servers: 'Proxy servers',
      name: 'Profile name',
      proxyRules: 'Proxy rules',
      scheme: 'Scheme',
      host: 'Server',
      port: 'Port',
      username: 'Username',
      password: 'Password',
      bypassList: 'Bypass List',
      bypassListDesc:
        'Servers for which you do not want to use any proxy: (One server on each line.)',
      bypassListLink: '(Wildcards and more available…)'
    }
  },
  validation: {
    required: '{{field}} is required.'
  }
};
