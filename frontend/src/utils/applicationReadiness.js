export const getReadinessItems = (profile, documentAnalysis, scheme) => {
    const documentType = documentAnalysis?.documentType || "";
    const hasIdentity = Boolean(profile?.applicantType || profile?.state || profile?.district);
    const hasBusiness = Boolean(profile?.businessType && profile?.businessStatus);
    const hasLoan = Number(profile?.loanAmount) > 0;
    const hasAnyDocument = Boolean(documentType && documentType !== "Other / Unknown");
    const hasConsistentDocument = hasAnyDocument && documentAnalysis?.overallStatus === "consistent";
    const hasCategoryDoc = documentType === "Category Certificate";
    const hasCategoryFlag = Boolean(profile?.womanEntrepreneur || profile?.scSt || profile?.rural || profile?.disability);
    const schemeRequiresCategory = Boolean(
        scheme?.id === "pmegp"
        || scheme?.id === "stand-up-india"
        || scheme?.id === "mudra" && hasCategoryFlag
        || hasCategoryFlag
    );

    const items = [
        {
            key: "identity",
            label: "Identity Information",
            status: hasIdentity ? "complete" : "needs_attention",
        },
        {
            key: "business",
            label: "Business Information",
            status: hasBusiness ? "complete" : "needs_attention",
        },
        {
            key: "loan",
            label: "Loan Information",
            status: hasLoan ? "complete" : "needs_attention",
        },
        {
            key: "documents",
            label: "Required Documents",
            status: hasConsistentDocument ? "complete" : "needs_attention",
        },
    ];

    if (schemeRequiresCategory) {
        items.push({
            key: "category",
            label: "Category Information",
            status: hasCategoryDoc || hasCategoryFlag ? "complete" : "needs_attention",
        });
    }

    return items;
};