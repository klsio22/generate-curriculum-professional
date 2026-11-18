import { GITHUB_PATH, LINKEDIN_PATH } from '@/shared/brandPaths';

interface BrandIconProps {
  size?: number;
  className?: string;
}

export const LinkedinIcon = ({ size = 16, className }: BrandIconProps) => (
  <svg width={size} height={size} viewBox={LINKEDIN_PATH.viewBox} fill="currentColor" className={className} aria-hidden>
    <path d={LINKEDIN_PATH.d} />
  </svg>
);

export const GithubIcon = ({ size = 16, className }: BrandIconProps) => (
  <svg width={size} height={size} viewBox={GITHUB_PATH.viewBox} fill="currentColor" className={className} aria-hidden>
    <path d={GITHUB_PATH.d} />
  </svg>
);
