import { Assessment as AssessmentIcon } from '@mui/icons-material';

<ListItem disablePadding>
  <ListItemButton 
    component={Link} 
    to="/stock-dashboard"
    selected={location.pathname === '/stock-dashboard'}
    sx={{
      '&.Mui-selected': {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.12)',
        },
      },
    }}
  >
    <ListItemIcon>
      <AssessmentIcon />
    </ListItemIcon>
    <ListItemText primary="Stock Dashboard" />
  </ListItemButton>
</ListItem> 