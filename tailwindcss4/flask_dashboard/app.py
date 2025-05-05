print("🚀 Flask app is starting...")

from flask import Flask, request, render_template, jsonify
import mysql.connector
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# App setup
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# MySQL connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="$Morpheus09$",
    database="auction_db"
)

def ensure_connection():
    global db
    try:
        db.ping(reconnect=True, attempts=3, delay=2)
    except:
        # In case ping fails badly, reconnect manually
        db.close()
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="$Morpheus09$",
            database="auction_db"
        )


@app.before_request
def before_request():
    ensure_connection()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password_input = data.get('password')
    ensure_connection()

    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Users WHERE email_id = %s", (email,))
        user = cursor.fetchone()

        if user:
            stored_password = user['password']

            # Legacy plaintext fallback
            if stored_password == 'hashedpassword' and password_input == 'hashedpassword':
                return jsonify({
                    'status': 'success',
                    'role': user['role'],
                    'user_id': user['user_id']
                })

            # Secure hashed password check
            elif check_password_hash(stored_password, password_input):
                return jsonify({
                    'status': 'success',
                    'role': user['role'],
                    'user_id': user['user_id']
                })

        # If no match
        return jsonify({'status': 'fail', 'message': 'Invalid credentials'}), 401

    except Exception as e:
        print("❌ Error during login:", e)
        return jsonify({'status': 'error', 'message': 'Server error'}), 500


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password_raw = data.get('password')
    role = data.get('role')
    ensure_connection()

    if not all([username, email, password_raw, role]):
        return jsonify({'status': 'fail', 'message': 'Missing fields'}), 400

    password_hashed = generate_password_hash(password_raw)
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO Users (username, email_id, password, role)
            VALUES (%s, %s, %s, %s)
        """, (username, email, password_hashed, role))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO Wallet (user_id, balance) VALUES (%s, 950.00)", (user_id,))
        db.commit()
        return jsonify({'status': 'success'}), 201
    except mysql.connector.Error as err:
        return jsonify({'status': 'fail', 'message': str(err)}), 500

@app.route('/create-auction', methods=['POST'])
def create_auction():
    data = request.json
    seller_id = data.get('seller_id')
    name = data.get('name')
    description = data.get('description')
    category = data.get('category')
    starting_price = data.get('starting_price')
    end_time = data.get('end_time')
    ensure_connection()

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Items (seller_id, name, description, category, starting_price)
            VALUES (%s, %s, %s, %s, %s)
        """, (seller_id, name, description, category, starting_price))
        item_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO Auctions (item_id, seller_id, end_time)
            VALUES (%s, %s, %s)
        """, (item_id, seller_id, end_time))
        db.commit()
        return jsonify({'status': 'success'}), 201
    except Exception as e:
        print("Error creating auction:", e)
        return jsonify({'status': 'fail', 'message': str(e)}), 500

@app.route('/seller-auctions/<int:seller_id>', methods=['GET'])
def seller_auctions(seller_id):
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT i.item_id, i.name, i.description, i.category, i.starting_price,
               a.auction_id, a.status, a.end_time, a.start_time,
               u.username AS seller_name
        FROM Items i
        JOIN Auctions a ON i.item_id = a.item_id
        JOIN Users u ON i.seller_id = u.user_id
        WHERE i.seller_id = %s
        ORDER BY a.start_time DESC
    """, (seller_id,))
    return jsonify(cursor.fetchall())



@app.route('/wallet/<int:user_id>', methods=['GET'])
def get_wallet(user_id):
    ensure_connection()
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT balance FROM Wallet WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()
        print(f"🧾 [Wallet Fetch] User ID: {user_id} → DB Result: {result}")  # 🔍 LOG

        if result:
            return jsonify({'status': 'success', 'balance': result['balance']})
        else:
            return jsonify({'status': 'fail', 'message': 'Wallet not found'}), 404
    except Exception as e:
        print("❌ Error fetching wallet:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/wallet/add', methods=['POST'])
def add_money():
    ensure_connection()
    data = request.json
    user_id = data.get('user_id')
    amount = float(data.get('amount'))

    if amount <= 0:
        return jsonify({'status': 'fail', 'message': 'Amount must be positive'}), 400

    try:
        cursor = db.cursor()
        cursor.execute("SELECT wallet_id FROM Wallet WHERE user_id = %s", (user_id,))
        wallet_row = cursor.fetchone()
        if not wallet_row:
            return jsonify({'status': 'fail', 'message': 'Wallet does not exist'}), 404
        wallet_id = wallet_row[0]

        cursor.execute("UPDATE Wallet SET balance = balance + %s WHERE user_id = %s", (amount, user_id))
        cursor.execute("""
            INSERT INTO Transactions (user_id, wallet_id, transaction_amt, transaction_type)
            VALUES (%s, %s, %s, 'deposit')
        """, (user_id, wallet_id, amount))
        db.commit()

        cursor.execute("SELECT balance FROM Wallet WHERE user_id = %s", (user_id,))
        new_balance = cursor.fetchone()[0]

        return jsonify({'status': 'success', 'balance': new_balance}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'status': 'fail', 'message': str(e)}), 500


@app.route('/live-auctions', methods=['GET'])
def live_auctions():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, i.name, i.category, i.starting_price, a.end_time
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        WHERE a.status = 'active'
    """)
    return jsonify(cursor.fetchall())

@app.route('/place-bid', methods=['POST'])
def place_bid():
    ensure_connection()
    data = request.json
    buyer_id = data.get('buyer_id')
    auction_id = data.get('auction_id')
    bid_amount = float(data.get('bid_amount'))


    try:
        cursor = db.cursor(dictionary=True)

        # Get current wallet balance
        cursor.execute("SELECT balance FROM Wallet WHERE user_id = %s", (buyer_id,))
        result = cursor.fetchone()
        if not result or result['balance'] < bid_amount:
            return jsonify({'status': 'fail', 'message': 'Insufficient balance'}), 400

        # Insert bid
        cursor.execute("""
            INSERT INTO Bids (auction_id, bidder_id, bid_amount)
            VALUES (%s, %s, %s)
        """, (auction_id, buyer_id, bid_amount))

        # Log transaction (optional)
        cursor.execute("""
    INSERT INTO Transactions (user_id, wallet_id, transaction_amt, transaction_type)
    VALUES (%s, (SELECT wallet_id FROM Wallet WHERE user_id = %s), %s, 'withdrawal')
""", (buyer_id, buyer_id, bid_amount))

       

        # Update wallet
        cursor.execute("""
            UPDATE Wallet SET balance = balance - %s WHERE user_id = %s
        """, (bid_amount, buyer_id))

        db.commit()
        return jsonify({'status': 'success'}), 200

    except Exception as e:
        db.rollback()
        print("❌ Error placing bid:", e)
        return jsonify({'status': 'fail', 'message': str(e)}), 500

@app.route('/my-bids/<int:buyer_id>', methods=['GET'])
def my_bids(buyer_id):
    ensure_connection()
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT i.name AS item_name, b.bid_amount, b.bid_time,
                   CASE 
                     WHEN b.bid_amount = (
                        SELECT MAX(b2.bid_amount)
                        FROM Bids b2
                        WHERE b2.auction_id = b.auction_id
                     ) THEN 'Winning'
                     ELSE 'Outbid'
                   END AS status
            FROM Bids b
            JOIN Auctions a ON b.auction_id = a.auction_id
            JOIN Items i ON a.item_id = i.item_id
            WHERE b.bidder_id = %s
            ORDER BY b.bid_time DESC
        """, (buyer_id,))
        bids = cursor.fetchall()
        return jsonify({'status': 'success', 'bids': bids})
    except Exception as e:
        print("❌ Error fetching user's bids:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/highest-bidder/<int:auction_id>', methods=['GET'])
def highest_bidder(auction_id):
    ensure_connection()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("SELECT COUNT(*) AS total FROM Bids WHERE auction_id = %s", (auction_id,))
        count_result = cursor.fetchone()
        print(f"🛠️ Debug: Bids found for auction {auction_id} = {count_result['total']}")

        cursor.execute("""
            SELECT u.user_id, u.username, b.bid_amount
            FROM Bids b
            JOIN Users u ON b.bidder_id = u.user_id
            WHERE b.auction_id = %s
            ORDER BY b.bid_amount DESC
            LIMIT 1
        """, (auction_id,))

        highest = cursor.fetchone()
        if highest:
            return jsonify({'status': 'success', 'data': highest})
        else:
            print("⚠️ No highest bidder found, even though bids exist.")
            return jsonify({'status': 'fail', 'message': 'No bids for this auction'}), 404
    except Exception as e:
        print(f"❌ Error in highest-bidder route: {str(e)}")
        return jsonify({'status': 'fail', 'message': 'Server error'}), 500


@app.route('/declare-winner', methods=['POST'])
def declare_winner():
    data = request.get_json()
    auction_id = data.get('auction_id')
    winner_id = data.get('winner_id')
    final_price = data.get('final_price')
    
    print(f"📩 Declare Winner Triggered: auction_id={auction_id}, winner_id={winner_id}, final_price={final_price}")

    if not auction_id or not winner_id or not final_price:
        return jsonify({'status': 'fail', 'message': 'Missing required data'}), 400

    ensure_connection()
    cursor = db.cursor(dictionary=True)

    try:
        # 1. Get seller_id for the auction
        cursor.execute("SELECT seller_id FROM Auctions WHERE auction_id = %s", (auction_id,))
        auction = cursor.fetchone()
        if not auction:
            return jsonify({'status': 'fail', 'message': 'Auction not found'}), 404

        seller_id = auction['seller_id']

        # 2. Insert winner into OrderHistory
        cursor.execute("""
            INSERT INTO OrderHistory (auction_id, winner_id, final_price)
            VALUES (%s, %s, %s)
        """, (auction_id, winner_id, final_price))

        # 3. Update auction status to 'completed'
        cursor.execute("UPDATE Auctions SET status = 'completed' WHERE auction_id = %s", (auction_id,))

        # ❗️IMPORTANT: DO NOT DEDUCT winner’s wallet again — it's already deducted when they placed the bid

        # 4. Refund all other bidders
        cursor.execute("""
            SELECT DISTINCT bidder_id FROM Bids
            WHERE auction_id = %s AND bidder_id != %s
        """, (auction_id, winner_id))
        other_bidders = cursor.fetchall()

        for bidder in other_bidders:
            bidder_id = bidder['bidder_id']
            cursor.execute("""
                SELECT SUM(bid_amount) AS total FROM Bids
                WHERE auction_id = %s AND bidder_id = %s
            """, (auction_id, bidder_id))
            total_bid = cursor.fetchone()['total'] or 0
            if total_bid > 0:
                cursor.execute("""
                    UPDATE Wallet SET balance = balance + %s WHERE user_id = %s
                """, (total_bid, bidder_id))

        # 5. Credit the seller
        cursor.execute("""
            UPDATE Wallet SET balance = balance + %s WHERE user_id = %s
        """, (final_price, seller_id))

        db.commit()
        print("✅ Winner declared and balances updated successfully.")
        return jsonify({'status': 'success'})

    except Exception as e:
        db.rollback()
        print("❌ Error in declare_winner:", e)
        return jsonify({'status': 'fail', 'message': str(e)}), 500



# Query 1: All Users & Wallets
@app.route('/query1', methods=['POST'])
def query1():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.user_id, u.username, u.email_id, u.role, w.balance
        FROM Users u
        LEFT JOIN Wallet w ON u.user_id = w.user_id
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="All Users with Wallet Balances")


@app.route('/query2', methods=['POST'])
def query2():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, a.seller_id, u.username AS seller_name,
               i.name AS item_name, a.start_time, a.end_time, a.status
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        JOIN Users u ON a.seller_id = u.user_id
        WHERE a.status = 'active'
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Active Auctions")



# Query 3: Bids for Specific Auction
@app.route('/query3', methods=['POST'])
def query3():
    ensure_connection()
    auction_id = request.form['auction_id']
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT b.bid_id, u.username AS bidder, b.bid_amount, b.bid_time
        FROM Bids b
        JOIN Users u ON b.bidder_id = u.user_id
        WHERE b.auction_id = %s
    """, (auction_id,))
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title=f"Bids for Auction ID: {auction_id}")


# Query 4
@app.route('/query4', methods=['POST'])
def query4():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT i.item_id, i.name AS item_name, u.username AS seller
        FROM Items i
        JOIN Users u ON i.seller_id = u.user_id
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Items and Sellers")


# Query 5
@app.route('/query5', methods=['POST'])
def query5():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT role, COUNT(*) AS total_users
        FROM Users
        GROUP BY role
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="User Count by Role")


# Query 6
@app.route('/query6', methods=['POST'])
def query6():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT t.user_id, u.username, SUM(t.transaction_amt) AS total_transaction
        FROM Transactions t
        JOIN Users u ON t.user_id = u.user_id
        GROUP BY t.user_id, u.username
        ORDER BY total_transaction DESC
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Total Transactions per User")


# Query 7
@app.route('/query7', methods=['POST'])
def query7():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT oh.order_id, oh.auction_id, i.name AS item_name, u.username AS winner_name, oh.final_price
        FROM OrderHistory oh
        JOIN Users u ON oh.winner_id = u.user_id
        JOIN Auctions a ON oh.auction_id = a.auction_id
        JOIN Items i ON a.item_id = i.item_id
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Auction Winners and Details")


# Query 8
@app.route('/query8', methods=['POST'])
def query8():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, i.name AS item_name, a.end_time
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        WHERE a.status = 'active' AND a.end_time < NOW()
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Ended Auctions Still Active")


# Query 9
@app.route('/query9', methods=['POST'])
def query9():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT t.user_id, u.username,
            SUM(CASE WHEN t.transaction_type = 'deposit' THEN t.transaction_amt ELSE 0 END) AS total_deposits,
            SUM(CASE WHEN t.transaction_type = 'withdrawal' THEN t.transaction_amt ELSE 0 END) AS total_withdrawals
        FROM Transactions t
        JOIN Users u ON t.user_id = u.user_id
        GROUP BY t.user_id, u.username
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Deposits and Withdrawals per User")

# Query 10
@app.route('/query10', methods=['POST'])
def query10():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, i.name AS item_name, COUNT(b.bid_id) AS total_bids
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        LEFT JOIN Bids b ON a.auction_id = b.auction_id
        GROUP BY a.auction_id, i.name
        ORDER BY total_bids DESC
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Total Bids per Auction")


# Query 11
@app.route('/query11', methods=['POST'])
def query11():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, i.name AS item_name, a.status
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        LEFT JOIN Bids b ON a.auction_id = b.auction_id
        WHERE b.bid_id IS NULL
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Auctions with No Bids")


# Query 12
@app.route('/query12', methods=['POST'])
def query12():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT DISTINCT u.user_id, u.username
        FROM Users u
        WHERE EXISTS (SELECT 1 FROM Auctions a WHERE a.seller_id = u.user_id)
          AND EXISTS (SELECT 1 FROM OrderHistory oh WHERE oh.winner_id = u.user_id)
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Users Who Bought and Sold")


# Query 13
@app.route('/query13', methods=['POST'])
def query13():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, 
               (SELECT u.username FROM Bids b2
                JOIN Users u ON b2.bidder_id = u.user_id
                WHERE b2.auction_id = a.auction_id
                ORDER BY b2.bid_amount DESC LIMIT 1) AS highest_bidder,
               (SELECT MAX(b3.bid_amount) FROM Bids b3 WHERE b3.auction_id = a.auction_id) AS highest_bid
        FROM Auctions a
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Highest Bidder Per Auction")


# Query 14
@app.route('/query14', methods=['POST'])
def query14():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT DISTINCT u.user_id, u.username
        FROM Users u
        WHERE u.user_id IN (SELECT DISTINCT b.bidder_id FROM Bids b)
          AND u.user_id NOT IN (SELECT DISTINCT oh.winner_id FROM OrderHistory oh)
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Users Who Bid But Never Won")


# Query 15
@app.route('/query15', methods=['POST'])
def query15():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT i.item_id, i.name AS item_name, u.username AS seller, 
               (SELECT MAX(final_price) FROM OrderHistory 
                WHERE auction_id IN (SELECT auction_id FROM Auctions WHERE item_id = i.item_id)) AS highest_sold_price
        FROM Items i
        JOIN Users u ON i.seller_id = u.user_id
        ORDER BY highest_sold_price DESC LIMIT 1
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Most Expensive Auctioned Item")


# Query 16
@app.route('/query16', methods=['POST'])
def query16():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, i.name AS item_name, i.starting_price,
               (SELECT MAX(b.bid_amount) FROM Bids b WHERE b.auction_id = a.auction_id) AS highest_bid
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        WHERE (SELECT MAX(b.bid_amount) FROM Bids b WHERE b.auction_id = a.auction_id) > 2 * i.starting_price
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="High Bids Over 2× Starting Price")


# Query 17
@app.route('/query17', methods=['POST'])
def query17():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, i.name AS item_name,
               COUNT(DISTINCT b.bidder_id) AS unique_bidders,
               MAX(b.bid_amount) AS highest_bid,
               MIN(b.bid_amount) AS lowest_bid
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        JOIN Bids b ON a.auction_id = b.auction_id
        GROUP BY a.auction_id, i.name
        ORDER BY unique_bidders DESC
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Auctions with Most Unique Bidders")


# Query 18
@app.route('/query18', methods=['POST'])
def query18():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.user_id, u.username,
               COUNT(b.bid_id) AS total_bids,
               SUM(b.bid_amount) AS total_bid_amount
        FROM Users u
        JOIN Bids b ON u.user_id = b.bidder_id
        GROUP BY u.user_id, u.username
        ORDER BY total_bids DESC
        LIMIT 10
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Top 10 Active Bidders")


# Query 19
@app.route('/query19', methods=['POST'])
def query19():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.user_id, u.username, w.balance
        FROM Wallet w
        JOIN Users u ON w.user_id = u.user_id
        ORDER BY w.balance DESC LIMIT 1
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="User with Highest Wallet Balance")


# Query 20
@app.route('/query20', methods=['POST'])
def query20():
    ensure_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.auction_id, i.name AS item_name
        FROM Auctions a
        JOIN Items i ON a.item_id = i.item_id
        LEFT JOIN Payments p ON a.auction_id = p.auction_id
        WHERE p.payment_id IS NULL
    """)
    rows = cursor.fetchall()
    return render_template('results.html', rows=rows, title="Auctions Without Payment")








if __name__ == '__main__':
    print("Running app with debug mode")
    app.run(debug=True)