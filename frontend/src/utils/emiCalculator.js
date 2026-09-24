const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateEMI(principal, annualInterestRate, tenureMonths) {
    const values = [principal, annualInterestRate, tenureMonths].map(Number);

    if (values.some((value) => !Number.isFinite(value))) return null;

    const [loanPrincipal, yearlyRate, months] = values;

    if (loanPrincipal <= 0 || yearlyRate < 0 || months <= 0) return null;

    const monthlyRate = yearlyRate / 12 / 100;
    const monthlyEMI = monthlyRate === 0
        ? loanPrincipal / months
        : loanPrincipal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
    const totalPayable = monthlyEMI * months;
    const totalInterest = totalPayable - loanPrincipal;

    return {
        monthlyEMI: roundToTwo(monthlyEMI),
        totalPayable: roundToTwo(totalPayable),
        totalInterest: roundToTwo(totalInterest),
    };
}
