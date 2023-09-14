import { nightMode } from './Theme';

nightMode();

interface LayoutProps {
  children: JSX.Element[];
}
const Layout = (props: LayoutProps) => {
  const { children } = props;
  return <div className="container mx-auto h-full py-6 flex flex-col">{children}</div>;
};
export default Layout;
