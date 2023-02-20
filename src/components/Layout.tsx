import nightMode from "./Theme";

nightMode();

interface LayoutProps {
  children: JSX.Element[];
}
const Layout = (props: LayoutProps) => {
  const { children } = props;
  return <div className="container max-h-screen mx-auto py-6">{children}</div>;
};
export default Layout;
