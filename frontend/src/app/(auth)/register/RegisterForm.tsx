'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signUp } from '@/lib/api/auth';
import { isStrongPassword, isEmail, isPhoneNumber, isRequired } from '@/lib/utils';
import Input from '@/components/ui/Input';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ErrorView from '@/components/common/ErrorView';

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get('email');
  const redirectParam = searchParams.get('redirect');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(emailParam ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // URLパラメータからemailをプリフィル
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // パスワード検証フラグ（コンポーネント全体で利用）
  const passwordValid = isStrongPassword(password);
  const passwordsMatch = password === passwordConfirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 利用規約同意バリデーションを一時的に無効化
    // if (!agree) {
    //   setError('利用規約に同意してください。');
    //   return;
    // }

    if (password !== passwordConfirm) {
      setError('パスワードが一致しません。');
      return;
    }

    // メールアドレスと電話番号の検証（電話は任意）
    if (!isRequired(email) || !isEmail(email)) {
      setError('有効なメールアドレスを入力してください。');
      return;
    }

    if (phoneNumber && !isPhoneNumber(phoneNumber)) {
      setError('電話番号は10〜11桁の数字で入力してください。');
      return;
    }

    // パスワード強度を共通関数で検証（変数はコンポーネント上で計算済み）
    if (!passwordValid) {
      setError('パスワードは8文字以上で、英大文字・小文字・数字を含めてください。');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, passwordConfirm, fullName, phoneNumber);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('登録が完了しました。ログインしてください。');

        // リダイレクトパラメータがある場合は、そのページへ遷移（招待受け入れフローなど）
        if (redirectParam) {
          setTimeout(() => {
            router.push(redirectParam);
          }, 1500);
        } else {
          // 通常のフローではフォームをクリア
          setFullName('');
          setEmail('');
          setPassword('');
          setPasswordConfirm('');
          setPhoneNumber('');
          setAgree(false);
        }
      }
    } catch (err) {
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="register-form">
      <ErrorView message={error} />
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div>
        <Input
          id="full-name"
          name="full-name"
          type="text"
          required
          label="氏名"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="山田 太郎"
        />
      </div>

      <div>
        <Input
          id="email"
          name="email"
          type="email"
          required
          label="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@railstutorial.org"
        />
      </div>

      <div>
        <Input
          id="phone"
          name="phone"
          type="tel"
          label="電話番号（任意）"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="090-1234-5678"
        />
      </div>

      <div>
        <Input
          id="password"
          name="password"
          type="password"
          required
          aria-describedby="pw-help"
          label="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <div>
        <Input
          id="password-confirm"
          name="password-confirm"
          type="password"
          required
          label="パスワード（確認）"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <div id="pw-help" className="text-sm text-warm-brown-600" aria-live="polite">
        <p>※ パスワードは8文字以上、英大文字・小文字、数字を含めてください。</p>
        <p
          className={
            'mt-1 ' + (password ? (passwordValid ? 'text-green-600' : 'text-red-600') : '')
          }
        >
          {password
            ? passwordValid
              ? 'パスワード要件を満たしています'
              : 'パスワードの要件を満たしていません'
            : ''}
        </p>
        <p
          className={
            passwordConfirm
              ? password === passwordConfirm
                ? 'text-green-600'
                : 'text-red-600'
              : ''
          }
        >
          {passwordConfirm
            ? password === passwordConfirm
              ? 'パスワードが一致しています'
              : '確認パスワードと一致していません'
            : ''}
        </p>
      </div>

      {/* <div className="flex items-center">
        <input
          id="terms-agreement"
          name="terms-agreement"
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="h-4 w-4 rounded border-warm-brown-200 text-warm-orange focus:ring-warm-orange"
        />
        <label htmlFor="terms-agreement" className="ml-2 block text-sm text-warm-brown-700">
          <a className="font-medium text-warm-brown-600 hover:text-warm-orange" href="#">
            利用規約
          </a>
          と
          <a className="font-medium text-warm-brown-600 hover:text-warm-orange ml-1" href="#">
            プライバシーポリシー
          </a>
          に同意します。
        </label>
      </div> */}

      <div>
        <PrimaryButton
          type="submit"
          loading={loading}
          disabled={loading || !isStrongPassword(password) || password !== passwordConfirm}
        >
          登録する
        </PrimaryButton>
      </div>
    </form>
  );
}
