import { Icon } from '@iconify-icon/react';
import { useNavigate } from 'react-router-dom';
import Profile from '../../assets/pfp.png';
import PropTypes from 'prop-types';

const Header = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
      <button
        title="Logout"
        className="text-sm px-3 py-3 bg-black/20 rounded-[50px] hover:bg-[#E45454]/30 flex items-center"
        onClick={handleLogout}
        >
        <Icon icon="streamline-sharp:logout-2" width="21" height="21" style={{ color: "#E45454" }} />
      </button>

      <div className="bg-white text-black rounded-[50px] px-4 py-2 text-sm flex items-center">
        <div>
          <div className="font-semibold leading-tight mb-1 text-xs">{user?.githubId || user?.username || 'User'}</div>
          <div className="text-xs -mt-1 flex items-center">
            <p className="mr-1">Authenticated</p>
            <Icon icon="mdi:github" width="16" height="16" style={{ color: "#787878" }} />
          </div>
        </div>
        <div className="ml-3">
          <img src={Profile} alt="Profile" className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
};

Header.propTypes = {
  user: PropTypes.object,
};

export default Header;
