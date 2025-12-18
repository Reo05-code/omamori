"use client";
import React from 'react';
import AlertItem from '../../../components/common/AlertItem';

export default function Page() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 作業中メンバー（３つの中の左） */}
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

        {/* 未対応アラート（３つの中の中央） */}
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

        {/* 稼働中の現場（３つの中の右） */}
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <span className="material-icons-outlined mr-2">map</span>リアルタイムマップ
            </h2>
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
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 text-xs">
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> <span>安全</span>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-3 h-3 bg-warm-orange rounded-full inline-block" /> <span>要確認 / 低バッテリー</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-danger rounded-full inline-block" /> <span>SOS</span>
              </div>
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
    </>
  );
}
