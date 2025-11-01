"use client";
import PolicyLayout from "@/components/policy-layout"

export default function ComplaintDataPage() {
  return (
    <PolicyLayout title="Complaint Data">
      <section className="mb-8">
<h2 className="text-2xl font-semibold mb-4 text-[#001633]">
Complaint Data to be Displayed by RAs
</h2>

    <p className="mb-4 text-sm text-gray-700">
      <strong>Data for the month ending:</strong>{" "}
      {new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}
    </p>

    <h3 className="text-xl font-semibold mb-3 text-[#001633]">
      Monthly Complaints Data
    </h3>
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Sr. No.
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Received from
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Pending at the end of last month
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Received
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Resolved*
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Total Pending#
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Pending complaints 3months
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Average Resolution time^ (in days)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1</td>
            <td className="border border-gray-300 px-3 py-2">
              Directly from Investors
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              N/A
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">2</td>
            <td className="border border-gray-300 px-3 py-2">
              SEBI (SCORES)
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              N/A
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2">3</td>
            <td className="border border-gray-300 px-3 py-2">
              Other Sources (if any)
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              N/A
            </td>
          </tr>
          <tr className="bg-gray-100 font-semibold">
            <td className="border border-gray-300 px-3 py-2" colSpan={2}>
              Grand Total
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              N/A
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="mb-6">
      <p className="text-sm text-gray-700 mb-2">
        <strong>
          Number of complaints received during month against the RA due to
          impersonation by some other entity:
        </strong>{" "}
        0
      </p>
      <p className="text-xs text-gray-600">
        <strong>Note:</strong> In case of any complaints received against
        the RA due to impersonation of the RA by some other entity, the RA
        may adjust the number of such complaints from total number of
        received/resolved complaints while preparing the above table.
        Further, RA must close such impersonation related complaints after
        following the due process as specified by SEBI/RAASB.
      </p>
    </div>

    <div className="text-xs text-gray-600 mb-6">
      <p className="mb-1">
        * Inclusive of complaints of previous months resolved in the current
        month.
      </p>
      <p className="mb-1">
        # Inclusive of complaints pending as on the last day of the month.
      </p>
      <p>
        ^ Average Resolution time is the sum total of time taken to resolve
        each complaint, in days, in the current month divided by total
        number of complaints resolved in the current month.
      </p>
    </div>

    <h3 className="text-xl font-semibold mb-3 text-[#001633]">
      Trend of Monthly Disposal of Complaints
    </h3>
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Sr. No.
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Month
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Carried forward from previous month
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Received
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Resolved*
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Total Pending#
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Average Resolution time^ (in days)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1</td>
            <td className="border border-gray-300 px-3 py-2">
              Novemeber, 2025
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              N/A
            </td>
          </tr>
          <tr className="bg-gray-100 font-semibold">
            <td className="border border-gray-300 px-3 py-2" colSpan={2}>
              Grand Total
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              N/A
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="text-xs text-gray-600 mb-6">
      <p className="mb-1">
        * Inclusive of complaints of previous months resolved in the current
        month.
      </p>
      <p>
        # Inclusive of complaints pending as on the last day of the month.
      </p>
    </div>

    <h3 className="text-xl font-semibold mb-3 text-[#001633]">
      Trend of Annual Disposal of Complaints
    </h3>
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Sr. No.
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Year
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Carried forward from previous year
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Received
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Resolved*
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              Pending#
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-3 py-2">1</td>
            <td className="border border-gray-300 px-3 py-2">2025-26</td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
          </tr>
          <tr className="bg-gray-100 font-semibold">
            <td className="border border-gray-300 px-3 py-2" colSpan={2}>
              Grand Total
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
            <td className="border border-gray-300 px-3 py-2 text-center">
              0
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="text-xs text-gray-600 mb-4">
      <p className="mb-1">
        *Inclusive of complaints of previous years resolved in the current
        year.
      </p>
      <p>
        #Inclusive of complaints pending as on the last day of the year.
      </p>
    </div>
  </section>
    </PolicyLayout>
  )
}