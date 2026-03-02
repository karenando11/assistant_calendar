import '../styles/LoggedOutView.css';

type LoggedOutViewProps = {
  onLoginAgain: () => void;
};

export function LoggedOutView({ onLoginAgain }: LoggedOutViewProps) {
  return (
    <main className="logged-out-view">
      <section className="logged-out-card" aria-label="Logged out notice">
        <h1 className="logged-out-card__title">You have been logged out</h1>
        <p className="logged-out-card__text">
          Your session has expired. Please sign in again to continue.
        </p>
        <button className="logged-out-card__button" onClick={onLoginAgain}>
          Go to login
        </button>
      </section>
    </main>
  );
}
