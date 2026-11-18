import { theme } from 'antd';

export const MenuItemLabel = ({ title, help }: { title: string; help: string }) => {
  const { token } = theme.useToken();
  return (
    <span className="block max-w-72 py-1">
      <span className="block font-medium">{title}</span>
      <span className="block text-xs whitespace-normal" style={{ color: token.colorTextDescription }}>
        {help}
      </span>
    </span>
  );
};
