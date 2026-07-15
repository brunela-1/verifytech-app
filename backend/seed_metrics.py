import os
import sys
from datetime import datetime, timedelta, timezone
import random
import uuid

# Adjust path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import SessionLocal
from app.models.user import User
from app.models.tech_profile import TechProfile
from app.models.service_request import ServiceRequest
from app.models.proposal import Proposal
from app.models.service import Service
from app.models.review import Review
from app.models.metrics import UserSession, ReferralSource, ActivityEvent, PlatformRevenue
from app.auth.security import get_password_hash


def seed():
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    
    # 1. Create fake users (Clients & Techs)
    print("Creating fake users...")
    clients = []
    techs = []
    
    for i in range(20):
        client = User(
            user_id=uuid.uuid4(),
            email=f"fake_client_{i}@example.com",
            hashed_password=get_password_hash("password"),
            role="client",
            is_active=True,
            created_at=now - timedelta(days=random.randint(10, 30))
        )
        db.add(client)
        clients.append(client)
        
    for i in range(15):
        tech = User(
            user_id=uuid.uuid4(),
            email=f"fake_tech_{i}@example.com",
            hashed_password=get_password_hash("password"),
            role="tech",
            is_active=True,
            created_at=now - timedelta(days=random.randint(10, 30))
        )
        db.add(tech)
        techs.append(tech)
        
    db.commit()
    
    # 2. Tech Profiles
    print("Creating tech profiles...")
    for tech in techs:
        # Make most tech profiles complete and verified
        is_complete = random.random() < 0.9 
        profile = TechProfile(
            user_id=tech.user_id,
            full_name=f"Fake Tech {tech.user_id}",
            specialty="Electricidad" if random.random() < 0.5 else "Plomería",
            dni_front_url="fake_url" if is_complete else None,
            dni_back_url="fake_url" if is_complete else None,
            cert_url="fake_url" if is_complete else None,
            verification_status="verified" if is_complete else "pending"
        )
        db.add(profile)
    db.commit()

    # 3. Referrals (Acquisition & Referral Rate)
    print("Creating referrals...")
    all_users = clients + techs
    for user in all_users:
        if random.random() < 0.6: # 60% referred by friend/family
            ref = ReferralSource(user_id=user.user_id, source="friend_family")
            db.add(ref)
        elif random.random() < 0.8:
            ref = ReferralSource(user_id=user.user_id, source="social_media")
            db.add(ref)
    db.commit()
    
    # 4. Service Requests & Proposals
    print("Creating requests and proposals...")
    for client in clients:
        # High request creation rate (2-4 per client)
        for _ in range(random.randint(2, 4)):
            req = ServiceRequest(
                id=uuid.uuid4(),
                client_id=client.user_id,
                title="Fake Request",
                description="Fix something",
                category="Electricidad",
                address="Fake Street 123",
                status="closed", # mostly closed because they were serviced
                created_at=now - timedelta(days=random.randint(5, 20))
            )
            db.add(req)
            
            # Create proposals for this request
            num_proposals = random.randint(2, 5)
            selected_tech = random.choice(techs)
            for j in range(num_proposals):
                tech = random.choice(techs) if j > 0 else selected_tech # Ensure at least one tech is picked
                is_accepted = (j == 0) # Accept the first one
                prop = Proposal(
                    id=uuid.uuid4(),
                    request_id=req.id,
                    tech_id=tech.user_id,
                    price=random.uniform(50.0, 200.0),
                    estimated_time="2 horas",
                    status="accepted" if is_accepted else "rejected",
                    created_at=req.created_at + timedelta(hours=random.randint(1, 24))
                )
                db.add(prop)
                
                # If accepted, create service and revenue
                if is_accepted:
                    svc = Service(
                        id=uuid.uuid4(),
                        request_id=req.id,
                        client_id=client.user_id,
                        tech_id=tech.user_id,
                        proposal_id=prop.id,
                        status="completed",
                        created_at=prop.created_at + timedelta(hours=1),
                        scheduled_start=prop.created_at + timedelta(hours=2)
                    )
                    db.add(svc)
                    
                    # 80% leave a review
                    if random.random() < 0.8:
                        rev = Review(
                            id=uuid.uuid4(),
                            service_id=svc.id,
                            reviewer_id=client.user_id,
                            reviewee_id=tech.user_id,
                            rating=random.randint(4, 5), # High ratings
                            comment="Great job!",
                            created_at=svc.created_at + timedelta(days=1)
                        )
                        db.add(rev)
                        
                    # Revenue (15% of proposal price)
                    rev_entry = PlatformRevenue(
                        transaction_id=uuid.uuid4(),
                        service_id=svc.id,
                        tech_id=tech.user_id,
                        commission_amount=round(float(prop.price) * 0.15, 2),
                        created_at=svc.created_at
                    )
                    db.add(rev_entry)
                    
    db.commit()
    
    # 5. Activity Events (AARRR Funnel)
    print("Creating activity events...")
    # Registration (High completion rate)
    for _ in range(50):
        db.add(ActivityEvent(event_type="registration_start", role="client"))
        if random.random() < 0.85: # 85% completion
            db.add(ActivityEvent(event_type="registration_complete", role="client"))
            
    for _ in range(30):
        db.add(ActivityEvent(event_type="registration_start", role="tech"))
        if random.random() < 0.75: # 75% completion
            db.add(ActivityEvent(event_type="registration_complete", role="tech"))
            
    # Profile Comparisons (Activation Client)
    for client in clients:
        for _ in range(random.randint(1, 3)):
            db.add(ActivityEvent(user_id=client.user_id, role="client", event_type="profile_comparison"))
            
    # Proposal Accepted Notifications (Activation Tech)
    for tech in techs:
        if random.random() < 0.9: # 90% got a proposal accepted
            db.add(ActivityEvent(user_id=tech.user_id, role="tech", event_type="proposal_accepted_notification"))
            
    # Proposal Views / Abandons (Low abandonment)
    for _ in range(100):
        db.add(ActivityEvent(event_type="proposal_view", role="client"))
        if random.random() < 0.1: # Only 10% abandon
            db.add(ActivityEvent(event_type="proposal_abandon", role="client"))
            
    # History Views (High retention)
    for _ in range(200):
        db.add(ActivityEvent(event_type="history_view", role="client"))
        
    # File Upload Abandons (Low abandonment)
    for _ in range(50):
        db.add(ActivityEvent(event_type="file_upload_start", role="tech"))
        if random.random() < 0.05: # Only 5% abandon
            db.add(ActivityEvent(event_type="file_upload_abandon", role="tech"))

    db.commit()

    # 6. Tech Sessions (High retention)
    print("Creating tech sessions...")
    for tech in techs:
        # Create 5-10 logins in the past week
        num_logins = random.randint(5, 10)
        for _ in range(num_logins):
            login_time = now - timedelta(days=random.randint(0, 6), hours=random.randint(0, 23))
            sess = UserSession(
                user_id=tech.user_id,
                role="tech",
                login_at=login_time
            )
            db.add(sess)
    db.commit()

    print("Successfully seeded metrics database!")
    db.close()

if __name__ == "__main__":
    seed()
