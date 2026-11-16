# Campus Lost and Found System

A centralized web-based platform designed to help students, faculty, and campus staff report, search, and recover lost belongings within the college campus.

## 📌 Project Overview

The **Campus Lost and Found System** is a DBMS Lab Mini Project developed as part of Semester V (Academic Year 2026–27).

The system provides a common platform where users can report lost or found items, browse available listings, and submit claims to recover their belongings. It also provides administrative controls to verify claims, manage listings, and maintain a secure and organized lost-and-found database.

## 🎯 Objectives

- To develop a centralized platform for managing lost and found items.
- To simplify the process of reporting and recovering missing belongings.
- To allow users to search and filter items based on different criteria.
- To implement a claim verification process to prevent false claims.
- To maintain organized records of items, users, and claim histories.

## ✨ Key Features

- **User Registration & Authentication:** Secure registration and login for students, faculty, and administrators.
- **Lost Item Reporting:** Users can report items they have lost by providing relevant details.
- **Found Item Reporting:** Users can post details of items they have found on campus.
- **Search & Filter:** Search for items using keywords, categories, locations, and status.
- **Claim Management:** Users can submit claims with descriptions or proof of ownership.
- **Claim Verification:** Finders or administrators can verify, approve, or reject claims.
- **Item Status Tracking:** Track items through statuses such as Open, Claimed, and Returned.
- **Admin Dashboard:** Administrators can manage users, monitor listings, and maintain records.

## 📦 Modules

1. **User Management & Registration Module**
   - User registration and authentication.
   - Profile management.
   - Role-based access for students, faculty, and admins.

2. **Item Management Module**
   - Add, edit, and delete lost or found item posts.
   - Store item descriptions, categories, dates, and locations.
   - Manage item availability and status.

3. **Claim & Verification Module**
   - Submit claims for found items.
   - Provide ownership details or proof.
   - Approve or reject claims.

4. **Search & Filter Module**
   - Search using item names and keywords.
   - Filter by category, location, and status.

5. **Admin Control Module**
   - Monitor and manage item listings.
   - Manage registered users.
   - Review claims and track claim histories.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Frontend Framework | React.js / Bootstrap |
| Backend | Node.js / Python (Flask/Django) / PHP |
| Database | MySQL / PostgreSQL |
| Development Tools | VS Code, MySQL Workbench |
| Version Control | Git and GitHub |

*Note: The final technology stack will depend on the tools selected during implementation.*

## 🗄️ Database Overview

The system may include the following major database entities:

- **Users:** Stores user details, login credentials, and roles.
- **Items:** Stores lost and found item information.
- **Categories:** Maintains item categories such as Electronics, Documents, Keys, and Accessories.
- **Claims:** Stores claim requests and verification details.
- **Locations:** Maintains campus locations where items are lost or found.

These entities will be connected through appropriate primary keys and foreign key relationships to maintain data integrity.

## ⚙️ System Workflow

1. A user registers or logs into the system.
2. The user reports a lost or found item.
3. The item details are stored in the database.
4. Other users can browse, search, and filter item listings.
5. A user submits a claim for a relevant found item.
6. The finder or administrator verifies the claim.
7. Once approved and handed over, the item status is updated to **Returned**.

## 🚀 Installation & Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd campus-lost-and-found
   ```

3. Install the required dependencies according to the selected frontend and backend technologies.

4. Configure the database connection.

5. Import or execute the provided SQL database file.

6. Start the backend and frontend development servers.

7. Open the application in your browser.

*Detailed setup instructions will be updated according to the final implementation.*

## 👥 Project Team

| Roll No. | Name |
|---|---|
| 24CE227 | Harshal Salunke |
| 24CE220 | Diya Jambhale |

## 🎓 Academic Details

- **Project:** DBMS Lab Mini Project
- **Title:** Campus Lost and Found System
- **Semester:** V
- **Academic Year:** 2026–27

## 🔮 Future Enhancements

- Email or in-app notifications for matching lost and found items.
- Image uploads for better item identification.
- Automatic matching of lost and found item descriptions.
- QR-code-based item identification.
- Mobile-friendly interface.

---

**Campus Lost and Found System** – Making lost belongings easier to find and recover within the campus!
