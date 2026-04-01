import './Header.css';

export default function Header() {
	return (
		<header className='header'>
			<div className='brand'>
				<div className='info'>
					<span className='site-name'>safe.ru</span>
					<span className='tagline'>Калькулятор коррекции цен и передачи локеров</span>
				</div>
			</div>

			<div className='deco' aria-hidden='true'>
				<img className='logo2' src='/img/logo2.svg' alt='' />
			</div>

			{/* Личный кабинет — временно скрыт (Этап 4)
			<div className='account'>
				<img className='account-icon' src='/img/account.svg' alt='' />
				<span className='account-text'>Личный кабинет</span>
			</div>
			*/}
		</header>
	);
}
