import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styles from './LoginScreen.module.css';

const LOGIN = 'admin';
const PASSWORD = '1787810';

export default function LoginScreen({ onAuth }) {
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();

  function onSubmit({ login, password }) {
    if (login === LOGIN && password === PASSWORD) {
      localStorage.setItem('promet_auth', '1');
      localStorage.setItem('promet_user', login);
      onAuth(login);
    } else {
      setError('root', { message: 'Неверный логин или пароль' });
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard} animate__animated animate__fadeInUp${shake ? ` ${styles.loginCardShake}` : ''}`}>
        <div className={styles.loginLogo}>
          <img src='/img/brand/logo.svg' alt='Промет' className={styles.loginLogoImg} />
        </div>

        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Вход в систему</h1>
          <p className={styles.loginSubtitle}>Конфигуратор шкафов-локеров</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.loginField}>
            <label className={styles.loginLabel} htmlFor='login'>Логин</label>
            <input
              className={`${styles.loginInput}${errors.root ? ` ${styles.loginInputError}` : ''}`}
              id='login'
              type='text'
              autoComplete='username'
              autoFocus
              {...register('login', { required: true })}
            />
          </div>

          <div className={styles.loginField}>
            <label className={styles.loginLabel} htmlFor='password'>Пароль</label>
            <input
              className={`${styles.loginInput}${errors.root ? ` ${styles.loginInputError}` : ''}`}
              id='password'
              type='password'
              autoComplete='current-password'
              {...register('password', { required: true })}
            />
          </div>

          {errors.root && (
            <p className={styles.loginError}>{errors.root.message}</p>
          )}

          <button className={styles.loginBtn} type='submit'>
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
