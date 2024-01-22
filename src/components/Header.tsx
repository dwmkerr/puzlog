import * as React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import Input from "@mui/joy/Input";
import Tooltip from "@mui/joy/Tooltip";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";
import ListDivider from "@mui/joy/ListDivider";

import UploadIcon from "@mui/icons-material/Upload";
import GitHubIcon from "@mui/icons-material/GitHub";
import DownloadIcon from "@mui/icons-material/Download";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import FileUploadButton from "./FileUploadButton";

interface MainMenuDropDownProps {
  onBackup: () => void;
  onRestoreComplete: (fileContents: string) => Promise<void>;
}

function MainMenuDropDown(props: MainMenuDropDownProps) {
  return (
    <Dropdown>
      <MenuButton
        variant="outlined"
        color="neutral"
        size="sm"
        sx={{
          maxWidth: "32px",
          maxHeight: "32px",
          borderRadius: "50%",
        }}
      >
        <ChecklistIcon />
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
        <MenuItem onClick={props.onBackup}>
          <DownloadIcon />
          Download
        </MenuItem>
        <FileUploadButton
          startDecorator={<UploadIcon />}
          color="neutral"
          variant="plain"
          size="sm"
          onFileUploadComplete={props.onRestoreComplete}
        />
      </Menu>
    </Dropdown>
  );
}

function UserMenuDropDown() {
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
            <Box sx={{ ml: 1.5 }}>
              <Typography level="title-sm" textColor="text.primary">
                Unknown User
              </Typography>
              <Typography level="body-xs" textColor="text.tertiary">
                X puzzles complete
              </Typography>
            </Box>
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

type HeaderProps = MainMenuDropDownProps;

export default function Header(props: HeaderProps) {
  return (
    <Box
      component="header"
      className="Header"
      sx={[
        {
          px: 2,
          py: 1,
          gap: 1,
          bgcolor: "background.surface",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 1100,
        },
      ]}
    >
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          justifyContent: "space-between",
        }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
          <MainMenuDropDown
            onBackup={props.onBackup}
            onRestoreComplete={props.onRestoreComplete}
          />
          <Typography level="title-lg">Puzlog</Typography>
        </Stack>
        <Box sx={{ display: { xs: "inline-flex", sm: "none" } }}>
          <IconButton variant="plain" color="neutral">
            <MenuRoundedIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <Input
            size="sm"
            variant="outlined"
            placeholder="Search anything…"
            startDecorator={<SearchRoundedIcon color="primary" />}
            endDecorator={
              <IconButton
                variant="outlined"
                color="neutral"
                sx={{ bgcolor: "background.level1" }}
              >
                <Typography level="title-sm" textColor="text.icon">
                  ⌘ K
                </Typography>
              </IconButton>
            }
            sx={{
              alignSelf: "center",
              display: {
                xs: "none",
                sm: "flex",
              },
            }}
          />
          <IconButton
            size="sm"
            variant="outlined"
            color="neutral"
            sx={{
              display: { xs: "inline-flex", sm: "none" },
              alignSelf: "center",
            }}
          >
            <SearchRoundedIcon />
          </IconButton>
          <Tooltip title="Puzlog on GitHub" variant="outlined">
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              component="a"
              href="https://github.com/dwmkerr/puzlog"
              sx={{ alignSelf: "center" }}
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>
          <UserMenuDropDown />
        </Box>
      </Box>
    </Box>
  );
}
