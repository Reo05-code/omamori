type Props = {
  message?: string | null;
};

export default function ErrorView({ message }: Props) {
  if (!message) return null;

  return (
    <div className="text-sm text-red-600 mb-2" role="alert">
      {message}
    </div>
  );
}
