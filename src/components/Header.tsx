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
import SyncIcon from "@mui/icons-material/Sync";
import DownloadIcon from "@mui/icons-material/Download";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BookRoundedIcon from "@mui/icons-material/BookRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
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
          borderRadius: "32px",
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
          <Tooltip title="Joy UI overview" variant="outlined">
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              component="a"
              href="/blog/first-look-at-joy/"
              sx={{ alignSelf: "center" }}
            >
              <BookRoundedIcon />
            </IconButton>
          </Tooltip>
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
                src="https://i.pravatar.cc/40?img=2"
                srcSet="https://i.pravatar.cc/80?img=2"
                sx={{ maxWidth: "32px", maxHeight: "32px" }}
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
              <MenuItem>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    src="https://i.pravatar.cc/40?img=2"
                    srcSet="https://i.pravatar.cc/80?img=2"
                    sx={{ borderRadius: "50%" }}
                  />
                  <Box sx={{ ml: 1.5 }}>
                    <Typography level="title-sm" textColor="text.primary">
                      Rick Sanchez
                    </Typography>
                    <Typography level="body-xs" textColor="text.tertiary">
                      rick@email.com
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <ListDivider />
              <MenuItem>
                <HelpRoundedIcon />
                Help
              </MenuItem>
              <MenuItem>
                <SettingsRoundedIcon />
                Settings
              </MenuItem>
              <ListDivider />
              <MenuItem component="a" href="/blog/first-look-at-joy/">
                First look at Joy UI
                <OpenInNewRoundedIcon />
              </MenuItem>
              <MenuItem
                component="a"
                href="https://github.com/mui/material-ui/tree/master/docs/data/joy/getting-started/templates/email"
              >
                Sourcecode
                <OpenInNewRoundedIcon />
              </MenuItem>
              <ListDivider />
              <MenuItem>
                <LogoutRoundedIcon />
                Log out
              </MenuItem>
            </Menu>
          </Dropdown>
        </Box>
      </Box>
    </Box>
  );
}
