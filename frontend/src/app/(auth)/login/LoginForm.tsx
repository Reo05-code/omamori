'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { LoginFormProps } from '@/types';
import { AUTH } from '@/constants/ui-messages';
import ErrorView from '@/components/common/ErrorView';
import Logo from '@/components/ui/Logo';
import Input from '@/components/ui/Input';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { APP_ROUTES } from '@/constants/routes';

export default function LoginForm({ onSubmit, loading = false, error = null }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <Logo variant="small" />
          </div>
          <h1 className="text-center text-3xl font-bold text-warm-brown-800">
            {AUTH.LOGIN.HEADINGS.TITLE}
          </h1>
          <p className="mt-2 text-center text-sm text-warm-brown-700">
            {AUTH.LOGIN.HEADINGS.DESCRIPTION}
          </p>
        </div>

        <div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <ErrorView message={error} />
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                label={AUTH.COMMON.LABELS.EMAIL}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                label={AUTH.COMMON.LABELS.PASSWORD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  href={APP_ROUTES.PASSWORD_REQUEST}
                  className="font-medium text-warm-brown-600 hover:text-warm-orange transition-colors duration-200"
                >
                  {AUTH.LOGIN.LINKS.FORGOT_PASSWORD}
                </Link>
              </div>
            </div>

            <div>
              <PrimaryButton type="submit" loading={loading}>
                {AUTH.LOGIN.BUTTONS.SUBMIT}
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-brown-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-warm-surface px-3 text-warm-brown-500">
                  {AUTH.LOGIN.LINKS.SEPARATOR}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-warm-brown-600">
                {AUTH.LOGIN.LINKS.NO_ACCOUNT}{' '}
                <Link
                  href={APP_ROUTES.REGISTER}
                  className="font-bold text-warm-brown-700 hover:text-warm-orange transition-colors duration-200"
                >
                  {AUTH.LOGIN.LINKS.REGISTER}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
