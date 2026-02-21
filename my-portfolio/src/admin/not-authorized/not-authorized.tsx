import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import './not-authorized.css';

export default function NotAuthorized() {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/admin');
  }

  return (
    <div className="not-authorized">
      <div className="not-authorized__card">
        <div className="not-authorized__icon">🔒</div>
        <h1>Not Authorized</h1>
        <p>
          Your account is not registered as an admin. Contact the site owner
          or ensure your UID is added to the <code>admins</code> collection
          in Firestore.
        </p>
        <div className="not-authorized__actions">
          <button className="btn btn--primary" onClick={handleLogout}>
            Sign Out
          </button>
          <a href="/" className="btn btn--outline">
            Back to Portfolio
          </a>
        </div>
      </div>
    </div>
  );
}
