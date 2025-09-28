import React, { useState } from 'react'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Menu, 
  MenuItem,
  Avatar,
  IconButton
} from '@mui/material'
import { 
  AccountCircle, 
  Settings, 
  ExitToApp,
  Home,
  Leaderboard as LeaderboardIcon 
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector(state => state.auth)
  const [anchorEl, setAnchorEl] = useState(null)

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    dispatch(logout())
    handleClose()
    navigate('/')
  }

  const handleProfile = () => {
    navigate('/profile')
    handleClose()
  }

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer', flexGrow: 0, mr: 4 }}
          onClick={() => navigate('/')}
        >
          🎯 English Quiz Master
        </Typography>
        
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            startIcon={<Home />}
            onClick={() => navigate('/')}
          >
            Ana Sayfa
          </Button>
          <Button 
            color="inherit"
            startIcon={<LeaderboardIcon />}
            onClick={() => navigate('/leaderboard')}
          >
            Liderlik
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <>
              <Typography variant="body2">
                Hoş geldin, {user?.name || 'Kullanıcı'}!
              </Typography>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.name?.[0] || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleProfile}>
                  <AccountCircle sx={{ mr: 1 }} />
                  Profil
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Çıkış Yap
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              color="inherit" 
              variant="outlined"
              onClick={() => navigate('/auth')}
            >
              Giriş Yap
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header