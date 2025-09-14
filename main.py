from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import json
import os
from pathlib import Path

app = FastAPI(title="Expense Tracking API")

# Data models
class Expense(BaseModel):
    id: Optional[str] = None
    amount: float
    category: str
    date: str
    description: str

class Income(BaseModel):
    amount: float
    month: str

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    date: str
    description: str

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None

class IncomeUpdate(BaseModel):
    amount: float

# Data storage files
EXPENSES_FILE = "data/expenses.json"
INCOME_FILE = "data/income.json"

# Initialize data directory and files
def init_data_files():
    os.makedirs("data", exist_ok=True)
    
    if not os.path.exists(EXPENSES_FILE):
        with open(EXPENSES_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(INCOME_FILE):
        with open(INCOME_FILE, 'w') as f:
            json.dump({"amount": 0, "month": datetime.now().strftime("%Y-%m")}, f)

def load_expenses():
    try:
        with open(EXPENSES_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_expenses(expenses):
    with open(EXPENSES_FILE, 'w') as f:
        json.dump(expenses, f, indent=2)

def load_income():
    try:
        with open(INCOME_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"amount": 0, "month": datetime.now().strftime("%Y-%m")}

def save_income(income):
    with open(INCOME_FILE, 'w') as f:
        json.dump(income, f, indent=2)

def generate_id():
    import uuid
    return str(uuid.uuid4())

# Initialize data files on startup
init_data_files()

# API Endpoints

@app.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    expenses = load_expenses()
    new_expense = expense.dict()
    new_expense["id"] = generate_id()
    expenses.append(new_expense)
    save_expenses(expenses)
    return new_expense

@app.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_update: ExpenseUpdate):
    expenses = load_expenses()
    
    for i, expense in enumerate(expenses):
        if expense["id"] == expense_id:
            update_data = expense_update.dict(exclude_unset=True)
            expenses[i].update(update_data)
            save_expenses(expenses)
            return expenses[i]
    
    raise HTTPException(status_code=404, detail="Expense not found")

@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    expenses = load_expenses()
    
    for i, expense in enumerate(expenses):
        if expense["id"] == expense_id:
            del expenses[i]
            save_expenses(expenses)
            return {"message": "Expense deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Expense not found")

@app.get("/expenses", response_model=List[Expense])
async def get_expenses(start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None)):
    expenses = load_expenses()
    
    if start_date or end_date:
        filtered_expenses = []
        for expense in expenses:
            expense_date = expense["date"]
            
            if start_date and expense_date < start_date:
                continue
            if end_date and expense_date > end_date:
                continue
                
            filtered_expenses.append(expense)
        
        return filtered_expenses
    
    return expenses

@app.get("/income")
async def get_income():
    return load_income()

@app.put("/income")
async def update_income(income_update: IncomeUpdate):
    income_data = load_income()
    income_data["amount"] = income_update.amount
    income_data["month"] = datetime.now().strftime("%Y-%m")
    save_income(income_data)
    return income_data

@app.get("/report/monthly")
async def get_monthly_report():
    current_month = datetime.now().strftime("%Y-%m")
    expenses = load_expenses()
    income_data = load_income()
    
    # Filter expenses for current month
    monthly_expenses = [
        expense for expense in expenses 
        if expense["date"].startswith(current_month)
    ]
    
    total_expenses = sum(expense["amount"] for expense in monthly_expenses)
    total_income = income_data["amount"]
    savings = total_income - total_expenses
    
    # Generate basic investment suggestions
    investment_suggestions = []
    if savings > 0:
        if savings >= 1000:
            investment_suggestions.append("Consider investing in a diversified index fund")
            investment_suggestions.append("Look into high-yield savings accounts for emergency fund")
        elif savings >= 500:
            investment_suggestions.append("Start building an emergency fund")
            investment_suggestions.append("Consider low-risk investment options")
        else:
            investment_suggestions.append("Focus on building emergency savings first")
    else:
        investment_suggestions.append("Review your expenses to increase savings")
        investment_suggestions.append("Consider budgeting tools to track spending")
    
    # Expense breakdown by category
    categories = {}
    for expense in monthly_expenses:
        category = expense["category"]
        categories[category] = categories.get(category, 0) + expense["amount"]
    
    return {
        "month": current_month,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "savings": savings,
        "expense_categories": categories,
        "investment_suggestions": investment_suggestions,
        "expenses": monthly_expenses
    }

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def serve_frontend():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)