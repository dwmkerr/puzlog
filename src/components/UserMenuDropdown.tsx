import React, { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Avatar from "@mui/joy/Avatar";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";
import ListDivider from "@mui/joy/ListDivider";

import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { User, onAuthStateChanged } from "firebase/auth";
import { PuzzleRepository } from "../lib/PuzzleRepository";

function UserInfo({ user }: { user?: User }) {
  if (user && user?.isAnonymous) {
    return (
      <Box sx={{ ml: 1.5 }}>
        <Typography level="title-sm" textColor="text.primary">
          Guest
        </Typography>
        <Typography level="body-xs" textColor="text.tertiary">
          {user.uid}
        </Typography>
        <Typography level="body-xs" textColor="text.tertiary">
          X puzzles complete
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ ml: 1.5 }}>
      <Typography level="title-sm" textColor="text.primary">
        Not Logged In
      </Typography>
    </Box>
  );
}
export default function UserMenuDropdown() {
  const puzzleRepository = new PuzzleRepository();
  const [user, setUser] = useState<User | undefined>(undefined);

  //  If we were not provided with an initial user object, get the current user.
  useEffect(() => {
    const getUser = async () => {
      const signedInUser = await puzzleRepository.signInAnonymously();
      setUser(signedInUser);
    };
    getUser();
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      puzzleRepository.getAuth(),
      (user) => {
        setUser(user || undefined);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <Dropdown>
      <MenuButton
        variant="plain"
        size="sm"
        sx={{
          maxWidth: "32px",
          maxHeight: "32px",
          borderRadius: "9999999px",
        }}
      >
        <Avatar sx={{ maxWidth: "32px", maxHeight: "32px" }} />
      </MenuButton>
      <Menu
        placement="bottom-end"
        size="sm"
        sx={{
          zIndex: "99999",
          p: 1,
          gap: 1,
          "--ListItem-radius": "var(--joy-radius-sm)",
        }}
      >
        <MenuItem disabled={true}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{
                maxWidth: "32px",
                maxHeight: "32px",
                borderRadius: "50%",
              }}
            />
            <UserInfo user={user} />
          </Box>
        </MenuItem>
        <ListDivider />
        <MenuItem disabled={true}>
          <SettingsRoundedIcon />
          Settings
        </MenuItem>
        <MenuItem disabled={true}>
          <LogoutRoundedIcon />
          Log out
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}
