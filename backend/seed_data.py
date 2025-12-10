"""
Seed script to populate the database with sample simulation data.
Run this after starting the backend to have demo data available.
"""

import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine, Base
from app.models import Candidate, SimulationResult, JobDescription

# Create tables
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(Candidate).first():
            print("Database already seeded. Skipping...")
            return
        
        # Create sample job descriptions
        jobs = [
            JobDescription(
                title="Senior Software Engineer",
                department="Engineering",
                description="""We're looking for a Senior Software Engineer to join our team.

Responsibilities:
- Design and implement scalable backend services
- Lead technical discussions and code reviews
- Mentor junior developers
- Collaborate with product and design teams

Requirements:
- 5+ years of software engineering experience
- Strong proficiency in Python or Node.js
- Experience with distributed systems
- Excellent communication skills""",
                required_skills=[
                    {"skill": "Python", "priority": "high"},
                    {"skill": "System Design", "priority": "high"},
                    {"skill": "API Development", "priority": "high"},
                    {"skill": "Code Review", "priority": "medium"},
                    {"skill": "Technical Communication", "priority": "medium"}
                ],
                nice_to_have_skills=[
                    {"skill": "Kubernetes", "priority": "low"},
                    {"skill": "Machine Learning", "priority": "low"}
                ],
                interview_type="technical"
            ),
            JobDescription(
                title="Customer Success Manager",
                department="Customer Success",
                description="""Join our Customer Success team to help clients achieve their goals.

Responsibilities:
- Manage a portfolio of enterprise accounts
- Drive product adoption and customer satisfaction
- Identify upsell opportunities
- Handle escalations and resolve issues

Requirements:
- 3+ years in customer success or account management
- Strong relationship-building skills
- Data-driven approach to customer health
- Excellent presentation skills""",
                required_skills=[
                    {"skill": "Relationship Management", "priority": "high"},
                    {"skill": "Communication", "priority": "high"},
                    {"skill": "Problem Solving", "priority": "medium"},
                    {"skill": "Data Analysis", "priority": "medium"}
                ],
                interview_type="behavioral"
            )
        ]
        
        for job in jobs:
            db.add(job)
        
        # Create sample candidates
        candidates = [
            Candidate(
                name="Sarah Chen",
                email="sarah.chen@example.com",
                role_applied="Senior Software Engineer"
            ),
            Candidate(
                name="Marcus Johnson",
                email="marcus.j@example.com",
                role_applied="Senior Software Engineer"
            ),
            Candidate(
                name="Emily Rodriguez",
                email="emily.r@example.com",
                role_applied="Customer Success Manager"
            ),
            Candidate(
                name="James Park",
                email="james.park@example.com",
                role_applied="Senior Software Engineer"
            )
        ]
        
        for candidate in candidates:
            db.add(candidate)
        
        db.commit()
        
        # Refresh to get IDs
        for candidate in candidates:
            db.refresh(candidate)
        
        # Create simulation results
        simulations = [
            # Sarah Chen - Strong overall, gaps in system design
            SimulationResult(
                candidate_id=candidates[0].id,
                simulation_type="Technical Coding Assessment",
                overall_score=78.5,
                skills_tested=[
                    {"skill_name": "Python", "score": 92, "max_score": 100, "rationale": "Excellent code quality and Pythonic patterns", "importance": "high"},
                    {"skill_name": "Problem Solving", "score": 85, "max_score": 100, "rationale": "Good algorithmic thinking, found optimal solution", "importance": "high"},
                    {"skill_name": "Code Organization", "score": 88, "max_score": 100, "rationale": "Well-structured, readable code", "importance": "medium"},
                    {"skill_name": "System Design", "score": 62, "max_score": 100, "rationale": "Struggled with scalability considerations", "importance": "high"},
                    {"skill_name": "Testing", "score": 70, "max_score": 100, "rationale": "Basic test coverage, missed edge cases", "importance": "medium"}
                ],
                verified_skills=["Python", "Problem Solving", "Code Organization"],
                skill_gaps=[
                    {
                        "skill_name": "System Design",
                        "current_score": 62,
                        "required_score": 80,
                        "gap_severity": "significant",
                        "importance_to_role": "high",
                        "suggested_probe_areas": [
                            "Experience with distributed systems",
                            "Scalability considerations",
                            "Database design decisions"
                        ]
                    },
                    {
                        "skill_name": "Testing",
                        "current_score": 70,
                        "required_score": 80,
                        "gap_severity": "moderate",
                        "importance_to_role": "medium",
                        "suggested_probe_areas": [
                            "Test-driven development experience",
                            "Integration testing approach",
                            "Edge case identification"
                        ]
                    }
                ],
                evaluation_rationale="Sarah demonstrated strong fundamental coding skills with excellent Python proficiency. However, during the system design portion, she focused too much on immediate functionality without considering scale. Her testing approach was functional but not comprehensive. Recommend probing her experience with larger-scale systems."
            ),
            
            # Marcus Johnson - Gaps in multiple areas
            SimulationResult(
                candidate_id=candidates[1].id,
                simulation_type="Technical Coding Assessment",
                overall_score=65.0,
                skills_tested=[
                    {"skill_name": "Python", "score": 75, "max_score": 100, "rationale": "Functional but not idiomatic Python", "importance": "high"},
                    {"skill_name": "Problem Solving", "score": 68, "max_score": 100, "rationale": "Found working solution but not optimal", "importance": "high"},
                    {"skill_name": "System Design", "score": 55, "max_score": 100, "rationale": "Limited understanding of distributed systems", "importance": "high"},
                    {"skill_name": "Communication", "score": 82, "max_score": 100, "rationale": "Clear explanation of thought process", "importance": "medium"},
                    {"skill_name": "API Development", "score": 60, "max_score": 100, "rationale": "Basic REST knowledge, missing best practices", "importance": "high"}
                ],
                verified_skills=["Communication"],
                skill_gaps=[
                    {
                        "skill_name": "System Design",
                        "current_score": 55,
                        "required_score": 80,
                        "gap_severity": "significant",
                        "importance_to_role": "high",
                        "suggested_probe_areas": [
                            "Past experience with large-scale systems",
                            "Understanding of CAP theorem",
                            "Caching strategies"
                        ]
                    },
                    {
                        "skill_name": "Python",
                        "current_score": 75,
                        "required_score": 85,
                        "gap_severity": "moderate",
                        "importance_to_role": "high",
                        "suggested_probe_areas": [
                            "Advanced Python features",
                            "Python ecosystem familiarity",
                            "Performance optimization"
                        ]
                    },
                    {
                        "skill_name": "API Development",
                        "current_score": 60,
                        "required_score": 80,
                        "gap_severity": "significant",
                        "importance_to_role": "high",
                        "suggested_probe_areas": [
                            "RESTful design principles",
                            "API versioning",
                            "Authentication/authorization patterns"
                        ]
                    }
                ],
                evaluation_rationale="Marcus showed decent communication skills but technical gaps are concerning for a senior role. His Python code works but lacks elegance. System design responses showed limited exposure to distributed systems. May be better suited for mid-level position."
            ),
            
            # Emily Rodriguez - Customer Success simulation
            SimulationResult(
                candidate_id=candidates[2].id,
                simulation_type="Customer Success Roleplay",
                overall_score=82.0,
                skills_tested=[
                    {"skill_name": "Communication", "score": 90, "max_score": 100, "rationale": "Excellent clarity and empathy", "importance": "high"},
                    {"skill_name": "Problem Solving", "score": 85, "max_score": 100, "rationale": "Creative solutions for customer issues", "importance": "high"},
                    {"skill_name": "Product Knowledge", "score": 72, "max_score": 100, "rationale": "Good general understanding, some gaps in advanced features", "importance": "medium"},
                    {"skill_name": "Data Analysis", "score": 65, "max_score": 100, "rationale": "Basic metrics understanding, limited deep analysis", "importance": "medium"},
                    {"skill_name": "Escalation Handling", "score": 88, "max_score": 100, "rationale": "Calm under pressure, good de-escalation", "importance": "high"}
                ],
                verified_skills=["Communication", "Problem Solving", "Escalation Handling"],
                skill_gaps=[
                    {
                        "skill_name": "Data Analysis",
                        "current_score": 65,
                        "required_score": 80,
                        "gap_severity": "moderate",
                        "importance_to_role": "medium",
                        "suggested_probe_areas": [
                            "Experience with customer health metrics",
                            "Data-driven decision making examples",
                            "Familiarity with analytics tools"
                        ]
                    },
                    {
                        "skill_name": "Product Knowledge",
                        "current_score": 72,
                        "required_score": 85,
                        "gap_severity": "moderate",
                        "importance_to_role": "medium",
                        "suggested_probe_areas": [
                            "Learning approach for new products",
                            "Technical depth in past roles",
                            "Ability to translate technical concepts"
                        ]
                    }
                ],
                evaluation_rationale="Emily excelled in interpersonal aspects of the simulation. Her natural empathy and calm demeanor made customers feel heard. The main development area is using data more strategically - she relied more on intuition than metrics. Also recommend deeper product training if hired."
            ),
            
            # James Park - Strong all around
            SimulationResult(
                candidate_id=candidates[3].id,
                simulation_type="Technical Coding Assessment",
                overall_score=91.0,
                skills_tested=[
                    {"skill_name": "Python", "score": 95, "max_score": 100, "rationale": "Expert-level Python with advanced patterns", "importance": "high"},
                    {"skill_name": "System Design", "score": 88, "max_score": 100, "rationale": "Strong architectural thinking", "importance": "high"},
                    {"skill_name": "Problem Solving", "score": 92, "max_score": 100, "rationale": "Optimal solutions with clear reasoning", "importance": "high"},
                    {"skill_name": "Testing", "score": 85, "max_score": 100, "rationale": "Comprehensive test coverage", "importance": "medium"},
                    {"skill_name": "Communication", "score": 78, "max_score": 100, "rationale": "Clear but could be more concise", "importance": "medium"}
                ],
                verified_skills=["Python", "System Design", "Problem Solving", "Testing"],
                skill_gaps=[
                    {
                        "skill_name": "Communication",
                        "current_score": 78,
                        "required_score": 85,
                        "gap_severity": "minor",
                        "importance_to_role": "medium",
                        "suggested_probe_areas": [
                            "Experience presenting to non-technical stakeholders",
                            "Documentation practices",
                            "Mentoring experience"
                        ]
                    }
                ],
                evaluation_rationale="James is a strong technical candidate who exceeded expectations in most areas. His only area for development is communication - he tends to be verbose and could improve at adapting explanations for different audiences. Highly recommended for technical skills."
            )
        ]
        
        for simulation in simulations:
            db.add(simulation)
        
        db.commit()
        
        print("✅ Database seeded successfully!")
        print(f"   - {len(jobs)} job descriptions")
        print(f"   - {len(candidates)} candidates")
        print(f"   - {len(simulations)} simulation results")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

