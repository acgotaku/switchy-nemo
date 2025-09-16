import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import {
  Button,
  ColorPicker,
  Dialog,
  Table,
  Form,
  FormValues,
  Rules,
  Link,
  Select
} from '@/components';
import { Edit } from '@/assets/icons';
import { BYPASS_LIST } from '@/utils/misc';
import { useStore, Profile } from '@options/stores';
import styles from './profile.module.css';

const ProfileView = observer(() => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profiles } = useStore();
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const profile = profiles.getProfileById(id as string);

  const [currentProfile, setCurrentProfile] = useState<FormValues>({});

  const [bypassList, setBypassList] = useState('');

  const [valid, setValid] = useState(true);

  const schemeOptions = [
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
    { label: 'SOCKS4', value: 'socks4' },
    { label: 'SOCKS5', value: 'socks5' }
  ];
  const profileRules: Rules = {
    name: [
      {
        required: true,
        message: 'The name of the profile is required.',
        trigger: ['change', 'blur']
      }
    ]
  };
  const updateProfile = useCallback(() => {
    if (valid) {
      profiles.updateProfile(currentProfile as Profile);
      setShowEditProfile(false);
    }
  }, [valid, currentProfile, profiles]);

  const updateProfileColor = useCallback(
    (color: string) => {
      setCurrentProfile(prevProfile => ({
        ...prevProfile,
        color
      }));

      profiles.updateProfile({
        ...currentProfile,
        color
      } as Profile);
    },
    [currentProfile, profiles]
  );

  const deleteProfile = useCallback(() => {
    if (profile) {
      profiles.removeProfile(profile);
      setShowDeleteProfile(false);
      navigate('/');
    }
  }, [profile, profiles, navigate]);

  const editServer = useCallback((index: number) => {
    console.log('Edit server', index);
    setShowEditProfile(true);
  }, []);

  const columns = [
    {
      name: 'proxyRules',
      label: t('views.profile.proxyRules')
    },
    {
      name: 'scheme',
      label: t('views.profile.scheme'),
      renderCell: (text: string) => {
        const option = schemeOptions.find(opt => opt.value === text);
        return option ? option.label : text;
      }
    },
    {
      name: 'host',
      label: t('views.profile.host')
    },
    {
      name: 'port',
      label: t('views.profile.port')
    },
    {
      name: 'action',
      label: t('common.action'),
      renderCell: (_text: string, _record: AnyLiteral, index: number) => (
        <button className={styles.editButton} onClick={() => editServer(index)}>
          <Edit className={styles.editButtonIcon} />
        </button>
      )
    }
  ];

  useEffect(() => {
    if (bypassList) {
      const list = bypassList.split('\n').map(item => item.trim());
      setCurrentProfile(prevProfile => ({
        ...prevProfile,
        bypassList: list.filter(item => item.length > 0)
      }));
    }
  }, [bypassList]);

  useEffect(() => {
    if (profile) {
      setCurrentProfile(profile);
      setBypassList(profile?.bypassList?.join('\n') || BYPASS_LIST.join('\n'));
    }
  }, [profile]);

  return (
    <div className={styles.profile}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <ColorPicker
            color={currentProfile.color}
            onChange={updateProfileColor}
            className={styles.colorPicker}
          />
          <h1 className={styles.title}>
            {t('views.profile.title', {
              name: profile?.name
            })}
          </h1>
        </div>
        <div className={styles.actions}>
          <Button
            variant="filled-danger"
            onClick={() => setShowDeleteProfile(true)}
          >
            {t('common.delete')}
          </Button>
          <Dialog
            visible={showDeleteProfile}
            title={t('views.profile.delete')}
            closable
            onClose={() => setShowDeleteProfile(false)}
            footer={
              <div className={styles.deleteProfileFooter}>
                <Button
                  variant="outlined"
                  onClick={() => setShowDeleteProfile(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button variant="filled-danger" onClick={deleteProfile}>
                  {t('common.delete')}
                </Button>
              </div>
            }
          >
            <div className={styles.deleteProfile}>
              <p>{t('views.profile.deleteConfirmation')}</p>
              <p className={styles.deleteProfileName}>{profile?.name}</p>
            </div>
          </Dialog>
        </div>
      </header>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('views.profile.servers')}</h2>
        <div className={styles.sectionBody}>
          <Table
            columns={columns}
            dataSource={[currentProfile]}
            className={styles.sectionTable}
          />
          <Dialog
            visible={showEditProfile}
            title={t('views.profile.edit')}
            onClose={() => setShowEditProfile(false)}
            footer={
              <div className={styles.editProfileFooter}>
                <Button
                  variant="outlined"
                  onClick={() => setShowEditProfile(false)}
                >
                  {t('common.close')}
                </Button>
                <Button type="submit" form="editProfile" disabled={!valid}>
                  {t('common.update')}
                </Button>
              </div>
            }
          >
            <div className={styles.editProfile}>
              <Form
                values={currentProfile}
                onValuesChange={setCurrentProfile}
                onValidateChange={setValid}
                id="editProfile"
                rules={profileRules}
                onSubmit={updateProfile}
                layout="vertical"
                showRequired={false}
              >
                <Form.Item label={t('views.profile.name')} field="name">
                  <Input autoFocus />
                </Form.Item>
                <Form.Item
                  label={t('views.profile.proxyRules')}
                  field="proxyRules"
                >
                  <Input disabled />
                </Form.Item>
                <Form.Item label={t('views.profile.scheme')} field="scheme">
                  <Select options={schemeOptions} />
                </Form.Item>
                <Form.Item label={t('views.profile.host')} field="host">
                  <Input />
                </Form.Item>
                <Form.Item label={t('views.profile.port')} field="port">
                  <Input type="number" />
                </Form.Item>
                <Form.Item label={t('views.profile.username')} field="username">
                  <Input />
                </Form.Item>
                <Form.Item label={t('views.profile.password')} field="password">
                  <Input type="password" />
                </Form.Item>
              </Form>
            </div>
          </Dialog>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('views.profile.bypassList')}</h2>
        <div className={styles.sectionBody}>
          <div className={styles.sectionDescription}>
            <p>{t('views.profile.bypassListDesc')}</p>
            <Link href="https://developer.chrome.com/docs/extensions/reference/api/proxy#bypass_list">
              {t('views.profile.bypassListLink')}
            </Link>
          </div>
          <Textarea
            rows={10}
            className={styles.sectionTextarea}
            value={bypassList}
            onChange={e => setBypassList(e.target.value)}
          />
        </div>
      </section>
    </div>
  );
});

export default ProfileView;
