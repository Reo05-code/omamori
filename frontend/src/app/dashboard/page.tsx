"use client"
import React, { useEffect, useState } from 'react'

export default function Page() {
	const toggleDark = () => {
		if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark')
	}

	useEffect(() => {
		if (typeof document === 'undefined') return

		// Load Noto Sans JP if not already present
		if (!document.querySelector('link[data-dash-font="noto-jp"]')) {
			const l = document.createElement('link')
			l.setAttribute('rel', 'stylesheet')
			l.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap')
			l.setAttribute('data-dash-font', 'noto-jp')
			document.head.appendChild(l)
		}

		// Ensure Material Icons are available
		if (!document.querySelector('link[data-dash-icons="material"]')) {
			const l2 = document.createElement('link')
			l2.setAttribute('rel', 'stylesheet')
			l2.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined')
			l2.setAttribute('data-dash-icons', 'material')
			document.head.appendChild(l2)
		}
	}, [])

	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

	return (
		<div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
			<div className="flex h-screen overflow-hidden">
				<aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col justify-between hidden md:flex transition-all duration-200 z-20 shadow-sm`}>
					<div>
						<div className="h-16 flex items-center justify-center border-b border-border-light dark:border-border-dark">
							<h1 className="text-xl font-bold tracking-wider text-primary dark:text-white uppercase">{sidebarCollapsed ? '' : 'Omamori'}</h1>
						</div>
						<nav className="mt-6 px-3 space-y-1">
							<a className={`relative group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-bold rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`} href="#">
								<span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>dashboard</span>
								{!sidebarCollapsed && <span className="font-semibold">ダッシュボード</span>}
							</a>
							<a className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`} href="#">
								<span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>people</span>
								{!sidebarCollapsed && <>メンバー</>}
							</a>
							<a className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`} href="#">
								<span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>article</span>
								{!sidebarCollapsed && <>作業ログ</>}
							</a>
							<a className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`} href="#">
								<div className="flex items-center">
									<span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>notifications</span>
									{!sidebarCollapsed && <>アラート</>}
								</div>
								{!sidebarCollapsed && <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-white bg-danger rounded-full">3</span>}
							</a>
							{/* collapse toggle inserted inline so it appears under Alerts */}
							<div className={`flex ${sidebarCollapsed ? 'justify-center' : ''} ${sidebarCollapsed ? 'px-2 py-2' : 'px-4 py-2'}`}>
								<button
									onClick={() => setSidebarCollapsed(s => !s)}
									aria-label="toggle sidebar"
									aria-expanded={!sidebarCollapsed}
									title={sidebarCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
									className={sidebarCollapsed
										? 'w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm border border-border-light text-gray-700 hover:bg-gray-50 transition'
										: 'w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white border border-border-light text-sm font-medium text-gray-600 hover:bg-gray-100 transition'}
								>
									<span className="material-icons-outlined">{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}</span>
									{!sidebarCollapsed && <span className="ml-2"></span>}
								</button>
							</div>
						</nav>
					</div>
					<div className="p-3 border-t border-border-light dark:border-border-dark">
						<a className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all`} href="#">
							<span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>settings</span>
							{!sidebarCollapsed && <>設定</>}
						</a>
					</div>
				</aside>

				<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
					<header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
						<button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary" type="button">
							<span className="material-icons-outlined">menu</span>
						</button>
						<div className="flex-1 flex justify-center lg:justify-start lg:ml-6">
								<div className="w-full max-w-lg lg:max-w-xs relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<span className="material-icons-outlined text-warm-brown-600 text-lg">search</span>
									</div>
									<input id="search" name="search" placeholder="作業員や現場を検索..." type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm text-gray-900 dark:text-gray-100 transition duration-150 ease-in-out shadow-inner-soft" />
								</div>
						</div>
						{/* header right-side controls removed per request */}
					</header>

					<main className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
							<div className="bg-white overflow-hidden shadow-sm rounded-xl border border-border-light dark:border-border-dark flex flex-col p-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">稼働中の作業員</h3>
									<span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-2xl">group</span>
								</div>
								<div className="flex items-baseline">
									<span className="text-4xl font-bold text-gray-900 dark:text-white">12</span>
								</div>
								<div className="mt-2 text-sm text-green-600 flex items-center">
									<span className="material-icons-outlined text-base mr-1">check_circle</span>
									全員安全
								</div>
							</div>

							<div className="relative bg-white overflow-hidden shadow-lg rounded-xl flex flex-col p-6 border border-border-light dark:border-border-dark">
								<span className="absolute left-0 top-0 bottom-0 w-1.5 bg-danger rounded-r-md" aria-hidden="true" />
								<div className="flex items-center justify-between mb-4 pl-4">
									<h3 className="text-sm font-medium text-primary">未対応アラート</h3>
									<span className="material-icons-outlined text-primary text-2xl">notifications_active</span>
								</div>
								<div className="flex items-baseline pl-4">
									<span className="text-4xl font-bold text-danger">3</span>
								</div>
								<div className="mt-2 text-sm text-danger flex items-center font-semibold pl-4">
									<span className="material-icons-outlined text-base mr-1 text-danger">warning</span>
									<span className="text-danger font-semibold">要対応</span>
								</div>
							</div>

							<div className="bg-white overflow-hidden shadow-sm rounded-xl border border-border-light dark:border-border-dark flex flex-col p-6">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">稼働中の現場</h3>
									<span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-2xl">map</span>
								</div>
								<div className="flex items-baseline">
									<span className="text-4xl font-bold text-gray-900 dark:text-white">4</span>
								</div>
								<div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">正常稼働中</div>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div className="lg:col-span-2 bg-white shadow-sm rounded-xl border border-border-light dark:border-border-dark flex flex-col h-full min-h-[400px]">
										<div className="p-5 border-b border-border-light dark:border-border-dark flex justify-between items-center">
											<h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center"><span className="material-icons-outlined mr-2">map</span>リアルタイムマップ</h2>
											<button className="text-sm text-secondary hover:text-green-600 font-medium">全画面表示</button>
										</div>
										<div className="flex-1 relative bg-white overflow-hidden rounded-b-xl map-pattern">
											<div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
														<div className="bg-danger text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white z-10 relative">A</div>
														<div className="absolute top-full mt-2 w-56 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 text-center z-20">
															<p className="text-sm font-bold dark:text-white">地図コンポーネント</p>
															<p className="text-xs text-gray-500 dark:text-gray-400">(予定地)</p>
															<button className="mt-2 inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-warm-orange text-white">詳細を見る</button>
														</div>
											</div>
											<div className="absolute bottom-1/3 right-1/3 transform">
														<div className="bg-danger text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white">B</div>
											</div>
											{/* Map legend */}
											<div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 text-xs">
												<div className="flex items-center space-x-2 mb-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"/> <span>安全</span></div>
												<div className="flex items-center space-x-2 mb-1"><span className="w-3 h-3 bg-warm-orange rounded-full inline-block"/> <span>要確認 / 低バッテリー</span></div>
												<div className="flex items-center space-x-2"><span className="w-3 h-3 bg-danger rounded-full inline-block"/> <span>SOS</span></div>
											</div>
										</div>
							</div>

							<div className="bg-white shadow-sm rounded-xl border border-border-light dark:border-border-dark flex flex-col">
								<div className="p-5 border-b border-border-light dark:border-border-dark">
									<h2 className="text-lg font-bold text-gray-900 dark:text-white">最近のアラート</h2>
								</div>
								<div className="p-4 space-y-4">
									<AlertItem name="田中 健太" time="10:05" text="動きが検知されません" variant="default" />
									<AlertItem name="鈴木 一郎" time="09:42" text="SOS信号" variant="important" />
									<AlertItem name="佐藤 学" time="09:15" text="バッテリー残量低下" variant="default" />
									<AlertItem name="高橋 エリ" time="08:30" text="エリア入室確認" variant="muted" />
								</div>
								<div className="p-4 border-t border-border-light dark:border-border-dark mt-auto">
									<button className="w-full py-2 text-sm text-primary dark:text-gray-300 font-medium hover:underline">すべてのアラートを見る</button>
								</div>
							</div>
						</div>
					</main>
				</div>

				<div className="fixed bottom-6 right-6">
					<button className="bg-primary hover:bg-gray-800 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
						<span className="material-icons-outlined">help_outline</span>
					</button>
				</div>
			</div>
		</div>
	)
}

function AlertItem({ name, time, text, variant = 'default' }: { name: string; time: string; text: string; variant?: 'default' | 'important' | 'muted' }) {
		const base = 'flex rounded-lg overflow-hidden border';
		const classes = variant === 'important'
			? `${base} bg-danger/10 border border-danger/30`
			: variant === 'muted'
				? `${base} bg-gray-50 dark:bg-slate-800/50 opacity-60 border border-gray-100 dark:border-gray-700`
				: `${base} bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700`;

		const bar = variant === 'important' ? 'bg-danger' : variant === 'muted' ? 'bg-green-500' : 'bg-gray-400';

		const initials = name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase()

		return (
			<div className={classes}>
				<div className={`w-1.5 ${bar}`}></div>
				<div className="p-3 w-full">
					<div className="flex justify-between items-start mb-1">
						<div className="flex items-center">
							<div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold mr-3 text-gray-700 dark:text-gray-100">{initials}</div>
							<h4 className="text-sm font-bold text-gray-900 dark:text-white">{name}</h4>
						</div>
						<span className="text-xs font-mono text-gray-500 dark:text-gray-400">{time}</span>
					</div>
					<p className={`text-sm ${variant === 'important' ? 'text-danger dark:text-red-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{text}</p>
				</div>
			</div>
		)
}
