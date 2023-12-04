import './quitButton.css'
export default function QuitButton() {

    function handleQuit() {
        localStorage.removeItem('excel_handler_token');
        window.location.replace('/');
    }
    return (
        <div className='quit-button-container'>
            <button className='quit-button'
                onClick={handleQuit}
            >▌▐</button>
        </div>
    )
}