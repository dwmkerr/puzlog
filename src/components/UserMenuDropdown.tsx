import React from "react";
import { User } from "firebase/auth";
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
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GoogleIcon from "@mui/icons-material/Google";

import { PuzzleRepository } from "../lib/PuzzleRepository";
import { AlertType, useAlertContext } from "../components/AlertContext";
import { PuzlogError } from "../lib/Errors";

function UserInfo({ user }: { user: User | undefined }) {
  //  Work out the user name and info.
  const puzzleRepository = new PuzzleRepository();
  const userName = user && user?.isAnonymous ? "Guest" : user?.displayName;
  const userDetail = user ? user.uid : "Not Logged In";

  //  Based on the state of the user, we will have options to link/logout.
  const showGuestSignInButton = !user;
  const showGoogleSignInButton = !user;
  const showLinkButton = user && user.isAnonymous;

  const { setAlertInfo } = useAlertContext();

  const linkGoogleAccount = async () => {
    if (!user) {
      throw new PuzlogError(
        "Link Account Error",
        "Unexpected null user when linking accounts"
      );
    }
    await puzzleRepository.linkAnonymousUserWithGoogle(user);
    setAlertInfo({
      type: AlertType.Success,
      title: "Accounts Linked",
      message: "Successfully linked your Google Account",
    });
  };

  return (
    <div>
      <MenuItem disabled={true}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Avatar
            src={user?.photoURL || undefined}
            sx={{
              maxWidth: "32px",
              maxHeight: "32px",
              borderRadius: "50%",
            }}
          />
          <Box sx={{ ml: 1.5 }}>
            <Typography level="title-sm" textColor="text.primary">
              {userName || "Unknown User"}
            </Typography>
            {user?.email && (
              <Typography level="body-xs" textColor="text.tertiary">
                {user.email}
              </Typography>
            )}
            <Typography level="body-xs" textColor="text.tertiary">
              {userDetail}
            </Typography>
          </Box>
        </Box>
      </MenuItem>
      <ListDivider />
      {showGuestSignInButton && (
        <MenuItem
          onClick={async () => await puzzleRepository.signInAnonymously()}
        >
          <AccountCircleIcon />
          Sign In as Guest
        </MenuItem>
      )}
      {showGoogleSignInButton && (
        <MenuItem
          onClick={async () => await puzzleRepository.signInWithGoogle()}
        >
          <GoogleIcon />
          Sign In with Google
        </MenuItem>
      )}
      {showLinkButton && (
        <MenuItem onClick={linkGoogleAccount}>
          <GoogleIcon />
          Link Google Account
        </MenuItem>
      )}
    </div>
  );
}

interface UserMenuDropdownProps {
  user?: User;
}

export default function UserMenuDropdown({ user }: UserMenuDropdownProps) {
  const puzzleRepository = new PuzzleRepository();

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
        <Avatar
          sx={{ maxWidth: "32px", maxHeight: "32px" }}
          src={user?.photoURL || undefined}
        />
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
        <UserInfo user={user} />
        <ListDivider />
        <MenuItem disabled={true}>
          <SettingsRoundedIcon />
          Settings
        </MenuItem>
        <MenuItem disabled={!user} onClick={() => puzzleRepository.signOut()}>
          <LogoutRoundedIcon />
          Log out
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}
