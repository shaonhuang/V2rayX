import * as React from "react";
import { styled } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import HomeIcon from "@mui/icons-material/Home";
import LinkIcon from "@mui/icons-material/Link";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import SettingsIcon from "@mui/icons-material/Settings";
import { setNavTab } from "../../store/navigationSlice";
import {useAppSelector,useAppDispatch} from '../../store/hooks'
import type { RootState } from "../../store/index";
const NavButton = styled(Button)({
  display: "flex",
  flexDirection: "column",
  textTransform: "none",
});
const Navigation = () => {
  const [value, setValue] = React.useState(0);
  const { tabName } = useAppSelector((state: RootState) => state.navTab);
  const dispatch = useAppDispatch();
  console.log(tabName);
  return (
    <nav>
      <Stack spacing={4} direction="row" className="flex justify-center">
        <NavButton
          variant={tabName === "home" ? "contained" : "text"}
          className="flex flex-col"
          onClick={() => dispatch(setNavTab("home"))}
        >
          General
          <HomeIcon />
        </NavButton>
        <NavButton
          variant={tabName === "config" ? "contained" : "text"}
          onClick={() => dispatch(setNavTab("config"))}
        >
          Configs <LinkIcon />
        </NavButton>
        <NavButton
          variant={tabName === "setting" ? "contained" : "text"}
          onClick={() => dispatch(setNavTab("setting"))}
        >
          Settings
          <SettingsIcon />
        </NavButton>
      </Stack>
    </nav>
  );
};
export default Navigation;
