import { useState } from 'react';
import './LoginScreen.css';

const LOGIN = 'admin';
const PASSWORD = '1787810';

export default function LoginScreen({ onAuth }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (login === LOGIN && password === PASSWORD) {
      localStorage.setItem('promet_auth', '1');
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  function handleChange(setter) {
    return (e) => {
      setError(false);
      setter(e.target.value);
    };
  }

  return (
    <div className='login-page'>
      <div className={`login-card${shake ? ' login-card--shake' : ''}`}>
        <div className='login-logo'>
          <img src='/img/logo.svg' alt='Промет' className='login-logo-img' />
        </div>

        <div className='login-header'>
          <h1 className='login-title'>Вход в систему</h1>
          <p className='login-subtitle'>Конфигуратор шкафов-локеров</p>
        </div>

        <form className='login-form' onSubmit={handleSubmit} noValidate>
          <div className='login-field'>
            <label className='login-label' htmlFor='login'>Логин</label>
            <input
              className={`login-input${error ? ' login-input--error' : ''}`}
              id='login'
              type='text'
              value={login}
              onChange={handleChange(setLogin)}
              autoComplete='username'
              autoFocus
            />
          </div>

          <div className='login-field'>
            <label className='login-label' htmlFor='password'>Пароль</label>
            <input
              className={`login-input${error ? ' login-input--error' : ''}`}
              id='password'
              type='password'
              value={password}
              onChange={handleChange(setPassword)}
              autoComplete='current-password'
            />
          </div>

          {error && (
            <p className='login-error'>Неверный логин или пароль</p>
          )}

          <button className='login-btn' type='submit'>
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
