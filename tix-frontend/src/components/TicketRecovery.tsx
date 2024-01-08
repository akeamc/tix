export default function TicketRecovery() {
  return (
    <div>
      <h1>Hämta biljett</h1>
      <form>
        <label>
          E-post
          <input type="email" name="email" />
        </label>
        <label>
          Ordernummer
          <input type="text" name="id" placeholder="ABCDEFGH" />
        </label>
        <button type="submit">Hämta biljetter</button>
      </form>
    </div>
  );
}
