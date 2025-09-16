import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Menu, Form, FormValues, Rules } from '@/components';
import { useStore, Profile } from '@options/stores';
import { Settings, Save, Plus } from '@/assets/icons';
import { uuid, BYPASS_LIST, getColor } from '@/utils/misc';
import styles from './sidebar.module.css';

const Sidebar = observer(() => {
  const { profiles } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [profile, setProfile] = useState<FormValues>({
    id: uuid(),
    name: ''
  });
  const [valid, setValid] = useState(true);

  const profileRules: Rules = useMemo(
    () => ({
      name: [
        {
          required: true,
          message: t('validation.required', {
            field: t('views.profile.name')
          }),
          trigger: ['change', 'blur']
        }
      ]
    }),
    [t]
  );

  const addProfile = useCallback(() => {
    setProfile({
      id: uuid(),
      name: '',
      color: getColor(),
      enabled: true,
      proxyRules: 'singleProxy',
      host: 'example.com',
      scheme: 'http',
      port: 80,
      username: '',
      password: '',
      bypassList: BYPASS_LIST
    });
    setShowAddProfile(true);
  }, []);

  const saveProfile = useCallback(() => {
    if (valid) {
      profiles.addProfile(profile as Profile);
      setShowAddProfile(false);
      navigate(`/profile/${profile.id}`);
    }
  }, [profile, valid, profiles, navigate]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <h1 className={styles.logoTitle}>
            <Link to="/" className={styles.logoLink}>
              {t('common.title')}
            </Link>
          </h1>
        </div>
        <nav className={styles.nav}>
          <h2 className={styles.heading}>{t('layouts.sidebar.settings')}</h2>
          <Menu className={styles.menu}>
            <Menu.MenuItem
              label={t('views.general.title')}
              to="general"
              Icon={Settings}
            />
            <Menu.MenuItem
              label={t('views.transfer.title')}
              to="transfer"
              Icon={Save}
            />
          </Menu>
        </nav>
        <nav className={styles.nav}>
          <h2 className={styles.heading}>{t('layouts.sidebar.profiles')}</h2>
          <button
            className={styles.addProfile}
            title={t('views.profile.new')}
            onClick={addProfile}
          >
            <Plus className={styles.addIcon} />
          </button>
          <Menu className={styles.menu}>
            {profiles.getProfiles.map(profile => (
              <Menu.MenuItem
                key={profile.id}
                label={profile.name}
                to={`profile/${profile.id}`}
              />
            ))}
          </Menu>
        </nav>
        <Dialog
          visible={showAddProfile}
          title={t('views.profile.new')}
          onClose={() => setShowAddProfile(false)}
          footer={
            <div className={styles.newProfileFooter}>
              <Button
                variant="outlined"
                onClick={() => setShowAddProfile(false)}
              >
                {t('common.close')}
              </Button>
              <Button type="submit" form="addProfile" disabled={!valid}>
                {t('common.create')}
              </Button>
            </div>
          }
        >
          <div className={styles.newProfile}>
            <Form
              values={profile}
              onValuesChange={setProfile}
              onValidateChange={setValid}
              id="addProfile"
              rules={profileRules}
              onSubmit={saveProfile}
              layout="vertical"
              showRequired={false}
            >
              <Form.Item label={t('views.profile.name')} field="name">
                <Input autoFocus />
              </Form.Item>
            </Form>
          </div>
        </Dialog>
      </div>
    </aside>
  );
});

export default Sidebar;
