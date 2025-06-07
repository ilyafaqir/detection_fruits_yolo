interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
}) => {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700';
  
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'before:absolute before:inset-0 before:-translate-x-full before:animate-[wave_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
    none: '',
  };

  const styles = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : '100%',
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${animations[animation]}
        relative overflow-hidden
        ${className}
      `}
      style={styles}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

export default Skeleton; 