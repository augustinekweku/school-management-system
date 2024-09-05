export default function EligibilityChecker() {
    const isEligible = (sch_data, request_info) => {
        let isAuthentic = false
        if (sch_data.user_id === request_info.user_id || request_info.usertype === Number(process.env.SMS_SUPER_ADMIN)) {
            isAuthentic = true
        }
        return isAuthentic
    }
    return {
        isEligible
    }
}