import React, { RefObject, useCallback, useRef, useState } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import Stack from "@mui/joy/Stack";
import Input from "@mui/joy/Input";
import Tooltip from "@mui/joy/Tooltip";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";

import ClearIcon from "@mui/icons-material/Clear";
import UploadIcon from "@mui/icons-material/Upload";
import GitHubIcon from "@mui/icons-material/GitHub";
import DownloadIcon from "@mui/icons-material/Download";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import FileUploadButton from "./FileUploadButton";
import UserMenuDropdown from "./UserMenuDropdown";

interface MainMenuDropDownProps {
  onBackup: () => void;
  onRestoreComplete: (fileContents: string) => Promise<void>;
}

function MainMenuDropDown(props: MainMenuDropDownProps) {
  //  We have to jump through some hoops to stop the internal file upload button
  //  from closing the menu when the 'input' element is selected to load the
  //  file.
  const fileUploadInputRef: RefObject<HTMLInputElement> = useRef(null);

  //  We must handle the menu open state ourselves - preventing close if the
  //  close event propagated from the upload input element.
  const [open, setOpen] = useState(false);
  const handleOpenChange = useCallback(
    (event: React.SyntheticEvent | null, isOpen: boolean) => {
      //  If a 'close' event is being propagated from the 'input' internally
      //  used in the upload button, prevent the menu from closing (otherwise
      //  we will lose the input and abort the upload).
      const inputEventTarget = event?.target as HTMLInputElement;
      console.log(`handleFileChange tag event target`, event);
      if (isOpen === false && inputEventTarget === fileUploadInputRef.current) {
        console.log(
          `input is closing menu - preventing close`,
          inputEventTarget
        );
        return;
      }
      setOpen(isOpen);
    },
    []
  );

  const onFileUploadComplete = async (fileContents: string) => {
    //  Close the menu, as we have prevented it from closing while the file
    //  upload is in operation.
    setOpen(false);

    //  Call the upload complete handler.
    props.onRestoreComplete(fileContents);
  };

  return (
    <Dropdown open={open} onOpenChange={handleOpenChange}>
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
          inputElementRef={fileUploadInputRef}
          onFileUploadComplete={onFileUploadComplete}
        />
      </Menu>
    </Dropdown>
  );
}

type HeaderProps = MainMenuDropDownProps & {
  searchText: string;
  onSearchTextChanged: (searchText: string) => void;
};

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
            autoFocus
            size="sm"
            variant="outlined"
            placeholder="Search puzzles..."
            value={props.searchText}
            onChange={(e) => {
              props.onSearchTextChanged(e.target.value);
            }}
            startDecorator={<SearchRoundedIcon color="primary" />}
            endDecorator={
              <IconButton
                variant="plain"
                size="sm"
                onClick={() => {
                  props.onSearchTextChanged("");
                }}
              >
                <ClearIcon />
              </IconButton>
            }
            sx={{
              alignSelf: "center",
              display: {
                xs: "none",
                sm: "flex",
              },
              width: "480px",
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
          <UserMenuDropdown />
        </Box>
      </Box>
    </Box>
  );
}
