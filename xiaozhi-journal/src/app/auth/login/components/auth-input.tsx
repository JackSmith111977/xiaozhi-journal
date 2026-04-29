'use client';

interface AuthInputProps {
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder: string;
  autoFocus?: boolean;
  autoComplete?: string;
  errorText?: string;
}

export function AuthInput({
  type,
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  autoFocus,
  autoComplete,
  errorText,
}: AuthInputProps) {
  const id = `auth-input-${type}-${placeholder.slice(0, 10)}`;

  return (
    <div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
        aria-describedby={errorText ? `${id}-error` : undefined}
        aria-invalid={!!errorText}
      />
      {errorText && (
        <p
          id={`${id}-error`}
          className="text-xs mt-1 text-destructive"
          role="alert"
        >
          {errorText}
        </p>
      )}
    </div>
  );
}
